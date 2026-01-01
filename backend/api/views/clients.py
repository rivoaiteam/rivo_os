"""
Client Views

ViewSets are thin - logic lives in services.
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from django.db.models import Q
from django.utils import timezone
from collections import defaultdict

from core.models import Client, Document, CallLog, Note
from core.storage import storage_service
from api.views.mixins import ActivityTrackingMixin
from api.services import ClientService
from api.serializers.clients import (
    ClientListSerializer,
    ClientDetailSerializer,
    ClientCreateSerializer,
    ClientUpdateSerializer,
    MarkNotProceedingSerializer,
    MarkNotEligibleSerializer,
    CreateCaseSerializer,
)


class ClientViewSet(ActivityTrackingMixin, viewsets.ModelViewSet):
    """
    ViewSet for Client CRUD operations and actions.

    list: GET /api/clients/
    create: POST /api/clients/
    retrieve: GET /api/clients/{id}/
    update: PUT /api/clients/{id}/
    partial_update: PATCH /api/clients/{id}/
    destroy: DELETE /api/clients/{id}/

    Custom actions:
    - log_call: POST /api/clients/{id}/log_call/
    - add_note: POST /api/clients/{id}/add_note/
    - upload_document: POST /api/clients/{id}/upload_document/
    - create_case: POST /api/clients/{id}/create_case/
    - mark_not_proceeding: POST /api/clients/{id}/mark_not_proceeding/
    - mark_not_eligible: POST /api/clients/{id}/mark_not_eligible/
    """

    activity_entity_type = 'client'
    permission_classes = [IsAuthenticated]
    pagination_class = None  # Disable pagination - return all clients as array
    queryset = Client.objects.all()

    def get_serializer_class(self):
        if self.action == 'list':
            return ClientListSerializer
        elif self.action == 'retrieve':
            return ClientDetailSerializer
        elif self.action == 'create':
            return ClientCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return ClientUpdateSerializer
        return ClientListSerializer

    def get_queryset(self):
        """Filter clients based on query params"""
        queryset = Client.objects.select_related(
            'source__source', 'source_campaign'
        ).prefetch_related(
            'documents', 'status_changes', 'cases'
        ).order_by('-created_at')

        # Filter by status
        status_param = self.request.query_params.get('status')
        if status_param:
            queryset = queryset.filter(status=status_param)

        # Filter by eligibility
        eligibility = self.request.query_params.get('eligibility')
        if eligibility:
            queryset = queryset.filter(eligibility_status=eligibility)

        # Filter by campaign
        campaign = self.request.query_params.get('campaign')
        if campaign:
            queryset = queryset.filter(source_campaign__name=campaign)

        # Filter by channel
        channel = self.request.query_params.get('channel')
        if channel:
            queryset = queryset.filter(source_channel=channel)

        # Search by name, phone, or email
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search) |
                Q(phone__icontains=search) |
                Q(email__icontains=search)
            )

        return queryset

    def _prefetch_activities(self, client_ids: list) -> dict:
        """Prefetch call logs and notes for multiple clients in 2 queries"""
        call_logs = CallLog.objects.filter(
            entity_type='client',
            entity_id__in=client_ids
        ).order_by('-timestamp')

        notes = Note.objects.filter(
            entity_type='client',
            entity_id__in=client_ids
        ).order_by('-timestamp')

        call_logs_by_client = defaultdict(list)
        for log in call_logs:
            call_logs_by_client[log.entity_id].append(log)

        notes_by_client = defaultdict(list)
        for note in notes:
            notes_by_client[note.entity_id].append(note)

        return {
            'call_logs': call_logs_by_client,
            'notes': notes_by_client,
        }

    def list(self, request, *args, **kwargs):
        """Override list to prefetch activities efficiently"""
        queryset = self.filter_queryset(self.get_queryset())
        client_ids = list(queryset.values_list('id', flat=True))

        activities = self._prefetch_activities(client_ids)

        serializer = self.get_serializer(
            queryset,
            many=True,
            context={
                **self.get_serializer_context(),
                'prefetched_call_logs': activities['call_logs'],
                'prefetched_notes': activities['notes'],
            }
        )
        return Response(serializer.data)

    def retrieve(self, request, *args, **kwargs):
        """Override retrieve to prefetch activities"""
        instance = self.get_object()

        activities = self._prefetch_activities([instance.id])

        serializer = self.get_serializer(
            instance,
            context={
                **self.get_serializer_context(),
                'prefetched_call_logs': activities['call_logs'],
                'prefetched_notes': activities['notes'],
            }
        )
        return Response(serializer.data)

    def perform_create(self, serializer):
        """Create client and initialize document placeholders"""
        client = serializer.save()

        # Create default document placeholders
        for doc_type in Document.DEFAULT_TYPES:
            Document.objects.create(
                client=client,
                type=doc_type,
                status='missing'
            )

        # Calculate eligibility
        client.calculate_eligibility()
        client.save()

    def perform_update(self, serializer):
        """Update client and recalculate eligibility"""
        client = serializer.save()
        client.calculate_eligibility()
        client.save()

    @action(detail=True, methods=['post'], parser_classes=[MultiPartParser, FormParser])
    def upload_document(self, request, pk=None):
        """Upload a document for a client"""
        client = self.get_object()

        doc_type = request.data.get('type')
        file = request.FILES.get('file')

        if not doc_type:
            return Response(
                {'error': 'Document type is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not file:
            return Response(
                {'error': 'File is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Upload file to Supabase Storage
        try:
            file_url = storage_service.upload_file(
                file_data=file.read(),
                filename=file.name,
                content_type=file.content_type,
                folder=f"clients/{client.id}"
            )
        except Exception as e:
            return Response(
                {'error': f'Failed to upload file: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        # For 'other' type, always create new document
        # For standard types, update existing or create new
        if doc_type == 'other':
            document = Document.objects.create(
                client=client,
                type=doc_type,
                file_url=file_url,
                status='uploaded',
                uploaded_at=timezone.now()
            )
        else:
            try:
                document = Document.objects.get(client=client, type=doc_type)
                # Delete old file if exists
                if document.file_url:
                    try:
                        storage_service.delete_file(document.file_url)
                    except Exception:
                        pass
                document.file_url = file_url
                document.status = 'uploaded'
                document.uploaded_at = timezone.now()
                document.save()
            except Document.DoesNotExist:
                document = Document.objects.create(
                    client=client,
                    type=doc_type,
                    file_url=file_url,
                    status='uploaded',
                    uploaded_at=timezone.now()
                )

        return Response({
            'id': document.id,
            'type': document.type,
            'status': document.status,
            'fileUrl': document.file_url,
            'uploadedAt': document.uploaded_at
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='delete_document/(?P<doc_id>[^/.]+)')
    def delete_document(self, request, pk=None, doc_id=None):
        """Delete a document for a client"""
        client = self.get_object()

        try:
            document = Document.objects.get(id=doc_id, client=client)
        except Document.DoesNotExist:
            return Response(
                {'error': 'Document not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Delete file from storage if exists
        if document.file_url:
            try:
                storage_service.delete_file(document.file_url)
            except Exception:
                pass

        # For 'other' type, delete the record entirely
        # For standard types, just clear the file_url
        if document.type == 'other':
            document.delete()
        else:
            document.file_url = ''
            document.status = 'pending'
            document.save()

        return Response({'success': True}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def mark_not_proceeding(self, request, pk=None):
        """Mark client as not proceeding - delegates to ClientService"""
        serializer = MarkNotProceedingSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Service handles locking and validation
        client = ClientService.mark_not_proceeding(
            client_id=int(pk),
            notes=serializer.validated_data.get('notes', '')
        )

        # Refresh client with prefetched data
        client = Client.objects.prefetch_related('status_changes', 'documents', 'cases').get(id=client.id)
        activities = self._prefetch_activities([client.id])

        return Response(ClientDetailSerializer(
            client,
            context={
                **self.get_serializer_context(),
                'prefetched_call_logs': activities['call_logs'],
                'prefetched_notes': activities['notes'],
            }
        ).data)

    @action(detail=True, methods=['post'])
    def mark_not_eligible(self, request, pk=None):
        """Mark client as not eligible - delegates to ClientService"""
        serializer = MarkNotEligibleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Service handles locking and validation
        client = ClientService.mark_not_eligible(
            client_id=int(pk),
            notes=serializer.validated_data.get('notes', '')
        )

        # Refresh client with prefetched data
        client = Client.objects.prefetch_related('status_changes', 'documents', 'cases').get(id=client.id)
        activities = self._prefetch_activities([client.id])

        return Response(ClientDetailSerializer(
            client,
            context={
                **self.get_serializer_context(),
                'prefetched_call_logs': activities['call_logs'],
                'prefetched_notes': activities['notes'],
            }
        ).data)

    @action(detail=True, methods=['post'])
    def create_case(self, request, pk=None):
        """Create a case from client - delegates to ClientService"""
        serializer = CreateCaseSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        # Service handles locking and validation
        client, case = ClientService.create_case(
            client_id=int(pk),
            case_type=data.get('caseType', 'residential'),
            service_type=data.get('serviceType', 'assisted'),
            application_type=data.get('applicationType', 'individual'),
            mortgage_type=data.get('mortgageType', 'conventional'),
            emirate=data.get('emirate', 'dubai'),
            transaction_type=data.get('transactionType', 'primaryPurchase'),
            property_status=data.get('propertyStatus', 'ready'),
            mortgage_term_years=data.get('mortgageTermYears', 25),
            mortgage_term_months=data.get('mortgageTermMonths', 0),
            loan_amount=data.get('loanAmount'),
            estimated_property_value=data.get('estimatedPropertyValue'),
            bank_product_ids=data.get('bankProductIds', []),
            notes=data.get('notes', '')
        )

        return Response({
            'client': ClientDetailSerializer(client).data,
            'caseId': case.id,
            'caseNumber': case.case_id
        })

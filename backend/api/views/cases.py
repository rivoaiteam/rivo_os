"""
Case Views

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

from core.models import Case, BankForm, BankProduct, CaseStageChange, CallLog, Note
from core.storage import storage_service
from api.views.mixins import ActivityTrackingMixin
from api.pagination import StandardPagination
from api.services import CaseService
from api.serializers.cases import (
    CaseListSerializer,
    CaseDetailSerializer,
    CaseCreateSerializer,
    CaseUpdateSerializer,
    AdvanceStageSerializer,
    DeclineSerializer,
    WithdrawSerializer,
    SetStageSerializer,
)


class CaseViewSet(ActivityTrackingMixin, viewsets.ModelViewSet):
    """
    ViewSet for Case CRUD operations and actions.

    list: GET /api/cases/
    create: POST /api/cases/
    retrieve: GET /api/cases/{id}/
    update: PUT /api/cases/{id}/
    partial_update: PATCH /api/cases/{id}/
    destroy: DELETE /api/cases/{id}/

    Custom actions:
    - log_call: POST /api/cases/{id}/log_call/
    - add_note: POST /api/cases/{id}/add_note/
    - upload_bank_form: POST /api/cases/{id}/upload_bank_form/
    - advance_stage: POST /api/cases/{id}/advance_stage/
    - decline: POST /api/cases/{id}/decline/
    - withdraw: POST /api/cases/{id}/withdraw/
    """

    activity_entity_type = 'case'
    permission_classes = [IsAuthenticated]
    pagination_class = StandardPagination
    queryset = Case.objects.all()

    def get_serializer_class(self):
        if self.action == 'list':
            return CaseListSerializer
        elif self.action == 'retrieve':
            return CaseDetailSerializer
        elif self.action == 'create':
            return CaseCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return CaseUpdateSerializer
        return CaseListSerializer

    def get_queryset(self):
        """Filter cases based on query params"""
        queryset = Case.objects.select_related('client').prefetch_related(
            'bank_products', 'bank_forms', 'stage_changes'
        ).order_by('-created_at')

        # Filter by stage
        stage = self.request.query_params.get('stage')
        if stage:
            queryset = queryset.filter(stage=stage)

        # Filter by active/terminal
        status_filter = self.request.query_params.get('status')
        if status_filter == 'active':
            queryset = queryset.filter(stage__in=Case.ACTIVE_STAGES)
        elif status_filter == 'terminal':
            queryset = queryset.filter(stage__in=Case.TERMINAL_STAGES)

        # Filter by client
        client_id = self.request.query_params.get('client')
        if client_id:
            queryset = queryset.filter(client_id=client_id)

        # Search by case_id or client name
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(case_id__icontains=search) |
                Q(client__first_name__icontains=search) |
                Q(client__last_name__icontains=search)
            )

        return queryset

    def _prefetch_activities(self, case_ids: list) -> dict:
        """Prefetch call logs and notes for multiple cases in 2 queries"""
        call_logs = CallLog.objects.filter(
            entity_type='case',
            entity_id__in=case_ids
        ).order_by('-timestamp')

        notes = Note.objects.filter(
            entity_type='case',
            entity_id__in=case_ids
        ).order_by('-timestamp')

        call_logs_by_case = defaultdict(list)
        for log in call_logs:
            call_logs_by_case[log.entity_id].append(log)

        notes_by_case = defaultdict(list)
        for note in notes:
            notes_by_case[note.entity_id].append(note)

        return {
            'call_logs': call_logs_by_case,
            'notes': notes_by_case,
        }

    def list(self, request, *args, **kwargs):
        """Override list to prefetch activities efficiently with pagination"""
        queryset = self.filter_queryset(self.get_queryset())

        # Paginate the queryset
        page = self.paginate_queryset(queryset)
        if page is not None:
            case_ids = [case.id for case in page]
            activities = self._prefetch_activities(case_ids)

            serializer = self.get_serializer(
                page,
                many=True,
                context={
                    **self.get_serializer_context(),
                    'prefetched_call_logs': activities['call_logs'],
                    'prefetched_notes': activities['notes'],
                }
            )
            return self.get_paginated_response(serializer.data)

        # Fallback for no pagination
        case_ids = list(queryset.values_list('id', flat=True))
        activities = self._prefetch_activities(case_ids)

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
        """Create case with auto-generated case_id and bank forms"""
        # Generate case ID
        case_id = Case.generate_case_id()

        # Get bank product IDs from validated data
        bank_product_ids = serializer.validated_data.pop('bankProductIds', [])

        # Create the case
        case = serializer.save(case_id=case_id, stage='processing')

        # Add bank products if provided
        if bank_product_ids:
            bank_products = BankProduct.objects.filter(id__in=bank_product_ids[:3])
            case.bank_products.set(bank_products)

        # Create default bank form placeholders
        for form_type in BankForm.DEFAULT_TYPES:
            BankForm.objects.create(
                case=case,
                type=form_type,
                status='missing'
            )

        # Create initial stage change
        CaseStageChange.objects.create(
            case=case,
            from_stage=None,
            to_stage='processing',
            notes='Case created'
        )

    @action(detail=True, methods=['post'], parser_classes=[MultiPartParser, FormParser])
    def upload_bank_form(self, request, pk=None):
        """Upload a bank form for a case"""
        case = self.get_object()

        form_type = request.data.get('type')
        file = request.FILES.get('file')

        if not form_type:
            return Response(
                {'error': 'Form type is required'},
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
                folder=f"cases/{case.id}/bank_forms"
            )
        except Exception as e:
            return Response(
                {'error': f'Failed to upload file: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        # For 'other' type, always create new bank form
        # For standard types, update existing or create new
        if form_type == 'other':
            bank_form = BankForm.objects.create(
                case=case,
                type=form_type,
                file_url=file_url,
                status='uploaded',
                uploaded_at=timezone.now()
            )
        else:
            try:
                bank_form = BankForm.objects.get(case=case, type=form_type)
                # Delete old file if exists
                if bank_form.file_url:
                    try:
                        storage_service.delete_file(bank_form.file_url)
                    except Exception:
                        pass
                bank_form.file_url = file_url
                bank_form.status = 'uploaded'
                bank_form.uploaded_at = timezone.now()
                bank_form.save()
            except BankForm.DoesNotExist:
                bank_form = BankForm.objects.create(
                    case=case,
                    type=form_type,
                    file_url=file_url,
                    status='uploaded',
                    uploaded_at=timezone.now()
                )

        return Response({
            'id': bank_form.id,
            'type': bank_form.type,
            'status': bank_form.status,
            'fileUrl': bank_form.file_url,
            'uploadedAt': bank_form.uploaded_at
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='delete_bank_form/(?P<form_id>[^/.]+)')
    def delete_bank_form(self, request, pk=None, form_id=None):
        """Delete a bank form for a case"""
        case = self.get_object()

        try:
            bank_form = BankForm.objects.get(id=form_id, case=case)
        except BankForm.DoesNotExist:
            return Response(
                {'error': 'Bank form not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Delete file from storage if exists
        if bank_form.file_url:
            try:
                storage_service.delete_file(bank_form.file_url)
            except Exception:
                pass

        # For 'other' type, delete the record entirely
        # For standard types, just clear the file_url
        if bank_form.type == 'other':
            bank_form.delete()
        else:
            bank_form.file_url = ''
            bank_form.status = 'missing'
            bank_form.save()

        return Response({'success': True}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def advance_stage(self, request, pk=None):
        """Advance case to the next stage - delegates to CaseService"""
        serializer = AdvanceStageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Service handles locking and validation
        case = CaseService.advance_stage(
            case_id=int(pk),
            notes=serializer.validated_data.get('notes', '')
        )

        return Response(CaseDetailSerializer(case).data)

    @action(detail=True, methods=['post'])
    def decline(self, request, pk=None):
        """Decline a case - delegates to CaseService"""
        serializer = DeclineSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Service handles locking and validation
        case = CaseService.decline(
            case_id=int(pk),
            reason=serializer.validated_data.get('reason', '')
        )

        return Response(CaseDetailSerializer(case).data)

    @action(detail=True, methods=['post'])
    def withdraw(self, request, pk=None):
        """Withdraw a case - delegates to CaseService"""
        serializer = WithdrawSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Service handles locking and validation
        case = CaseService.withdraw(
            case_id=int(pk),
            reason=serializer.validated_data.get('reason', '')
        )

        return Response(CaseDetailSerializer(case).data)

    @action(detail=True, methods=['post'])
    def set_stage(self, request, pk=None):
        """Set case stage directly (for drag and drop in kanban) - delegates to CaseService"""
        serializer = SetStageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Service handles locking
        case = CaseService.set_stage(
            case_id=int(pk),
            new_stage=serializer.validated_data.get('stage'),
            notes=serializer.validated_data.get('notes', '')
        )

        return Response(CaseDetailSerializer(case).data)

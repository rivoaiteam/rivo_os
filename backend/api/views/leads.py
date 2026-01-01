"""
Lead Views

ViewSets are thin - logic lives in services.
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q, Prefetch
from collections import defaultdict

from core.models import Lead, CallLog, Note
from api.views.mixins import ActivityTrackingMixin
from api.services import LeadService
from api.serializers.leads import (
    LeadListSerializer,
    LeadDetailSerializer,
    LeadCreateSerializer,
    LeadUpdateSerializer,
    DropLeadSerializer,
    ConvertLeadSerializer,
)


class LeadViewSet(ActivityTrackingMixin, viewsets.ModelViewSet):
    """
    ViewSet for Lead CRUD operations and actions.

    list: GET /api/leads/
    create: POST /api/leads/
    retrieve: GET /api/leads/{id}/
    update: PUT /api/leads/{id}/
    partial_update: PATCH /api/leads/{id}/
    destroy: DELETE /api/leads/{id}/

    Custom actions:
    - log_call: POST /api/leads/{id}/log_call/
    - add_note: POST /api/leads/{id}/add_note/
    - drop: POST /api/leads/{id}/drop/
    - convert: POST /api/leads/{id}/convert/
    """

    activity_entity_type = 'lead'
    permission_classes = [IsAuthenticated]
    pagination_class = None  # Disable pagination - return all leads as array
    queryset = Lead.objects.all()

    def get_serializer_class(self):
        if self.action == 'list':
            return LeadListSerializer
        elif self.action == 'retrieve':
            return LeadDetailSerializer
        elif self.action == 'create':
            return LeadCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return LeadUpdateSerializer
        return LeadListSerializer

    def get_queryset(self):
        """Filter leads based on query params"""
        queryset = Lead.objects.select_related('source__source').order_by('-created_at')

        # Prefetch status changes and converted client
        queryset = queryset.prefetch_related('status_changes', 'converted_client')

        # Filter by status
        status_param = self.request.query_params.get('status')
        if status_param:
            queryset = queryset.filter(status=status_param)

        # Filter by source (SubSource ID)
        source = self.request.query_params.get('source')
        if source:
            queryset = queryset.filter(source_id=source)

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

    def _prefetch_activities(self, lead_ids: list) -> dict:
        """Prefetch call logs and notes for multiple leads in 2 queries"""
        # Fetch all call logs for these leads
        call_logs = CallLog.objects.filter(
            entity_type='lead',
            entity_id__in=lead_ids
        ).order_by('-timestamp')

        # Fetch all notes for these leads
        notes = Note.objects.filter(
            entity_type='lead',
            entity_id__in=lead_ids
        ).order_by('-timestamp')

        # Group by entity_id
        call_logs_by_lead = defaultdict(list)
        for log in call_logs:
            call_logs_by_lead[log.entity_id].append(log)

        notes_by_lead = defaultdict(list)
        for note in notes:
            notes_by_lead[note.entity_id].append(note)

        return {
            'call_logs': call_logs_by_lead,
            'notes': notes_by_lead,
        }

    def list(self, request, *args, **kwargs):
        """Override list to prefetch activities efficiently"""
        queryset = self.filter_queryset(self.get_queryset())
        lead_ids = list(queryset.values_list('id', flat=True))

        # Prefetch activities in 2 queries instead of N*2
        activities = self._prefetch_activities(lead_ids)

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

        # Prefetch activities for single lead
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

    @action(detail=True, methods=['post'])
    def drop(self, request, pk=None):
        """Drop a lead - delegates to LeadService"""
        serializer = DropLeadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Service handles locking and validation
        lead = LeadService.drop_lead(
            lead_id=int(pk),
            notes=serializer.validated_data.get('notes', '')
        )

        # Refresh lead with prefetched data
        lead = Lead.objects.prefetch_related('status_changes', 'converted_client').get(id=lead.id)
        activities = self._prefetch_activities([lead.id])

        return Response(LeadDetailSerializer(
            lead,
            context={
                **self.get_serializer_context(),
                'prefetched_call_logs': activities['call_logs'],
                'prefetched_notes': activities['notes'],
            }
        ).data)

    @action(detail=True, methods=['post'])
    def convert(self, request, pk=None):
        """Convert a lead to a client - delegates to LeadService"""
        serializer = ConvertLeadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Service handles locking and validation
        lead, client = LeadService.convert_lead(
            lead_id=int(pk),
            notes=serializer.validated_data.get('notes', '')
        )

        # Refresh lead with prefetched data
        lead = Lead.objects.prefetch_related('status_changes', 'converted_client').get(id=lead.id)
        activities = self._prefetch_activities([lead.id])

        return Response({
            'lead': LeadDetailSerializer(
                lead,
                context={
                    **self.get_serializer_context(),
                    'prefetched_call_logs': activities['call_logs'],
                    'prefetched_notes': activities['notes'],
                }
            ).data,
            'clientId': client.id
        })

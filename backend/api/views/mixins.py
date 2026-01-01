"""
ViewSet mixins for shared functionality
"""
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from core.models import CallLog, Note
from api.serializers.common import LogCallSerializer, AddNoteSerializer


class ActivityTrackingMixin:
    """
    Mixin providing log_call and add_note actions for entities.
    Requires activity_entity_type class attribute to be set.
    """
    activity_entity_type = None  # Must be set in subclass ('lead', 'client', 'case')

    @action(detail=True, methods=['post'])
    def log_call(self, request, pk=None):
        """Log a call for the entity"""
        obj = self.get_object()
        serializer = LogCallSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        call_log = CallLog.objects.create(
            entity_type=self.activity_entity_type,
            entity_id=obj.id,
            outcome=serializer.validated_data['outcome'],
            notes=serializer.validated_data.get('notes', '')
        )

        # Update entity's updated_at
        obj.save()

        return Response({
            'id': call_log.id,
            'outcome': call_log.outcome,
            'notes': call_log.notes,
            'timestamp': call_log.timestamp
        }, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def add_note(self, request, pk=None):
        """Add a note to the entity"""
        obj = self.get_object()
        serializer = AddNoteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        note = Note.objects.create(
            entity_type=self.activity_entity_type,
            entity_id=obj.id,
            content=serializer.validated_data['content']
        )

        # Update entity's updated_at
        obj.save()

        return Response({
            'id': note.id,
            'content': note.content,
            'timestamp': note.timestamp
        }, status=status.HTTP_201_CREATED)

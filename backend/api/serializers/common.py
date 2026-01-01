"""
Common Serializers - shared across leads, clients, and cases
"""

from rest_framework import serializers
from core.models import CallLog, Note


class CallLogSerializer(serializers.ModelSerializer):
    """Serializer for CallLog model"""

    class Meta:
        model = CallLog
        fields = ['id', 'outcome', 'notes', 'timestamp']
        read_only_fields = ['id', 'timestamp']


class NoteSerializer(serializers.ModelSerializer):
    """Serializer for Note model"""

    class Meta:
        model = Note
        fields = ['id', 'content', 'timestamp']
        read_only_fields = ['id', 'timestamp']


class LogCallSerializer(serializers.Serializer):
    """Serializer for logging a call"""

    outcome = serializers.ChoiceField(choices=CallLog.OUTCOME_CHOICES)
    notes = serializers.CharField(required=False, allow_blank=True)


class AddNoteSerializer(serializers.Serializer):
    """Serializer for adding a note"""

    content = serializers.CharField()
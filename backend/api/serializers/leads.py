"""
Lead Serializers
"""

from rest_framework import serializers
from core.models import Lead, CallLog, Note, LeadStatusChange, SubSource
from api.serializers.common import CallLogSerializer, NoteSerializer, LogCallSerializer, AddNoteSerializer


class StatusChangeSerializer(serializers.ModelSerializer):
    """Serializer for LeadStatusChange model"""

    class Meta:
        model = LeadStatusChange
        fields = ['id', 'type', 'notes', 'timestamp']
        read_only_fields = ['id', 'timestamp']


class LeadListSerializer(serializers.ModelSerializer):
    """Serializer for Lead list view - includes activity data for table display"""

    firstName = serializers.CharField(source='first_name')
    lastName = serializers.CharField(source='last_name')
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)
    updatedAt = serializers.DateTimeField(source='updated_at', read_only=True)
    sourceDisplay = serializers.CharField(source='source_display', read_only=True)
    sourceSlaMin = serializers.SerializerMethodField()
    hasActivity = serializers.SerializerMethodField()
    callLogs = serializers.SerializerMethodField()
    notes = serializers.SerializerMethodField()
    statusChanges = serializers.SerializerMethodField()
    convertedClientId = serializers.SerializerMethodField()

    class Meta:
        model = Lead
        fields = [
            'id', 'firstName', 'lastName', 'email', 'phone',
            'sourceDisplay', 'sourceSlaMin', 'hasActivity', 'intent', 'status',
            'createdAt', 'updatedAt', 'callLogs', 'notes', 'statusChanges', 'convertedClientId'
        ]

    def get_sourceSlaMin(self, obj):
        return obj.source.default_sla_min if obj.source else None

    def get_hasActivity(self, obj):
        """Check if lead has any activity - uses prefetched data"""
        call_logs = self._get_prefetched_call_logs(obj)
        notes = self._get_prefetched_notes(obj)
        return len(call_logs) > 0 or len(notes) > 0

    def _get_prefetched_call_logs(self, obj):
        """Get call logs from prefetched context or fallback to query"""
        prefetched = self.context.get('prefetched_call_logs')
        if prefetched is not None:
            return prefetched.get(obj.id, [])
        # Fallback for when serializer is used without prefetch
        return list(CallLog.objects.filter(entity_type='lead', entity_id=obj.id))

    def _get_prefetched_notes(self, obj):
        """Get notes from prefetched context or fallback to query"""
        prefetched = self.context.get('prefetched_notes')
        if prefetched is not None:
            return prefetched.get(obj.id, [])
        # Fallback for when serializer is used without prefetch
        return list(Note.objects.filter(entity_type='lead', entity_id=obj.id))

    def get_callLogs(self, obj):
        call_logs = self._get_prefetched_call_logs(obj)
        return CallLogSerializer(call_logs, many=True).data

    def get_notes(self, obj):
        notes = self._get_prefetched_notes(obj)
        return NoteSerializer(notes, many=True).data

    def get_statusChanges(self, obj):
        # Uses prefetched status_changes from queryset
        return StatusChangeSerializer(obj.status_changes.all(), many=True).data

    def get_convertedClientId(self, obj):
        """Get the client ID if this lead was converted - uses prefetched data"""
        # Uses prefetched converted_client from queryset
        clients = list(obj.converted_client.all())
        return clients[0].id if clients else None


class LeadDetailSerializer(LeadListSerializer):
    """Serializer for Lead detail view - extends list with transcript field"""

    class Meta:
        model = Lead
        fields = [
            'id', 'firstName', 'lastName', 'email', 'phone',
            'sourceDisplay', 'sourceSlaMin', 'hasActivity', 'intent', 'status', 'transcript',
            'createdAt', 'updatedAt', 'callLogs', 'notes', 'statusChanges', 'convertedClientId'
        ]


class LeadCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a Lead"""

    firstName = serializers.CharField(source='first_name')
    lastName = serializers.CharField(source='last_name')
    sourceId = serializers.PrimaryKeyRelatedField(
        source='source',
        queryset=SubSource.objects.all(),
        required=False,
        allow_null=True
    )

    class Meta:
        model = Lead
        fields = [
            'firstName', 'lastName', 'email', 'phone',
            'sourceId', 'intent', 'transcript'
        ]


class LeadUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating a Lead"""

    firstName = serializers.CharField(source='first_name', required=False)
    lastName = serializers.CharField(source='last_name', required=False)
    sourceId = serializers.PrimaryKeyRelatedField(
        source='source',
        queryset=SubSource.objects.all(),
        required=False,
        allow_null=True
    )

    class Meta:
        model = Lead
        fields = [
            'firstName', 'lastName', 'email', 'phone',
            'sourceId', 'intent', 'transcript'
        ]


class DropLeadSerializer(serializers.Serializer):
    """Serializer for dropping a lead"""

    notes = serializers.CharField(required=False, allow_blank=True)


class ConvertLeadSerializer(serializers.Serializer):
    """Serializer for converting a lead to client"""

    notes = serializers.CharField(required=False, allow_blank=True)

"""
WhatsApp Message Serializers
"""

from rest_framework import serializers
from core.models import WhatsAppMessage


class WhatsAppMessageSerializer(serializers.ModelSerializer):
    """Serializer for WhatsApp messages"""

    createdAt = serializers.DateTimeField(source='created_at', read_only=True)

    class Meta:
        model = WhatsAppMessage
        fields = [
            'id',
            'direction',
            'phone',
            'content',
            'status',
            'createdAt',
        ]
        read_only_fields = ['id', 'createdAt']


class SendMessageSerializer(serializers.Serializer):
    """Serializer for sending a WhatsApp message"""

    lead_id = serializers.IntegerField(required=False)
    client_id = serializers.IntegerField(required=False)
    content = serializers.CharField(max_length=4096)

    def validate(self, data):
        if not data.get('lead_id') and not data.get('client_id'):
            raise serializers.ValidationError(
                'Either lead_id or client_id is required'
            )
        if data.get('lead_id') and data.get('client_id'):
            raise serializers.ValidationError(
                'Only one of lead_id or client_id should be provided'
            )
        return data

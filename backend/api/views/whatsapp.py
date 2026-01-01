"""
WhatsApp Message Views
"""

from django.db.models import Max, Q
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from core.models import WhatsAppMessage, Lead, Client
from api.serializers.whatsapp import WhatsAppMessageSerializer, SendMessageSerializer


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def whatsapp_conversations(request):
    """
    Get all WhatsApp conversations (grouped by lead/client).
    Returns a list of conversations with the contact name, last message, and unread count.
    """
    conversations = []

    # Get unique lead conversations
    lead_ids = WhatsAppMessage.objects.filter(
        lead__isnull=False
    ).values_list('lead_id', flat=True).distinct()

    for lead_id in lead_ids:
        lead = Lead.objects.filter(id=lead_id).first()
        if not lead:
            continue

        last_message = WhatsAppMessage.objects.filter(
            lead_id=lead_id
        ).order_by('-created_at').first()

        if last_message:
            conversations.append({
                'entityType': 'lead',
                'entityId': lead.id,
                'name': f"{lead.first_name} {lead.last_name}",
                'phone': lead.phone,
                'lastMessage': last_message.content[:50] + ('...' if len(last_message.content) > 50 else ''),
                'lastMessageTime': last_message.created_at,
                'lastMessageDirection': last_message.direction,
            })

    # Get unique client conversations
    client_ids = WhatsAppMessage.objects.filter(
        client__isnull=False
    ).values_list('client_id', flat=True).distinct()

    for client_id in client_ids:
        client = Client.objects.filter(id=client_id).first()
        if not client:
            continue

        last_message = WhatsAppMessage.objects.filter(
            client_id=client_id
        ).order_by('-created_at').first()

        if last_message:
            conversations.append({
                'entityType': 'client',
                'entityId': client.id,
                'name': f"{client.first_name} {client.last_name}",
                'phone': client.phone,
                'lastMessage': last_message.content[:50] + ('...' if len(last_message.content) > 50 else ''),
                'lastMessageTime': last_message.created_at,
                'lastMessageDirection': last_message.direction,
            })

    # Sort by last message time (most recent first)
    conversations.sort(key=lambda x: x['lastMessageTime'], reverse=True)

    return Response(conversations)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def whatsapp_messages(request):
    """
    Get WhatsApp messages for a lead or client.

    Query params:
    - lead_id: Filter by lead ID
    - client_id: Filter by client ID
    """
    lead_id = request.query_params.get('lead_id')
    client_id = request.query_params.get('client_id')

    if not lead_id and not client_id:
        return Response(
            {'error': 'Either lead_id or client_id is required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    if lead_id:
        messages = WhatsAppMessage.objects.filter(lead_id=lead_id)
    else:
        messages = WhatsAppMessage.objects.filter(client_id=client_id)

    serializer = WhatsAppMessageSerializer(messages, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def whatsapp_send(request):
    """
    Send a WhatsApp message (mock - stores in DB only).

    Body:
    - lead_id or client_id: The entity to send to
    - content: Message text
    """
    serializer = SendMessageSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    lead_id = serializer.validated_data.get('lead_id')
    client_id = serializer.validated_data.get('client_id')
    content = serializer.validated_data['content']

    # Get the phone number from lead or client
    if lead_id:
        try:
            lead = Lead.objects.get(id=lead_id)
            phone = lead.phone
        except Lead.DoesNotExist:
            return Response(
                {'error': 'Lead not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    else:
        try:
            client = Client.objects.get(id=client_id)
            phone = client.phone
        except Client.DoesNotExist:
            return Response(
                {'error': 'Client not found'},
                status=status.HTTP_404_NOT_FOUND
            )

    # Create the outbound message
    message = WhatsAppMessage.objects.create(
        direction='outbound',
        phone=phone,
        content=content,
        status='sent',
        lead_id=lead_id,
        client_id=client_id,
    )

    return Response(
        WhatsAppMessageSerializer(message).data,
        status=status.HTTP_201_CREATED
    )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def whatsapp_simulate_inbound(request):
    """
    Simulate an inbound WhatsApp message (for testing).

    Body:
    - lead_id or client_id: The entity the message is from
    - content: Message text
    """
    serializer = SendMessageSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    lead_id = serializer.validated_data.get('lead_id')
    client_id = serializer.validated_data.get('client_id')
    content = serializer.validated_data['content']

    # Get the phone number from lead or client
    if lead_id:
        try:
            lead = Lead.objects.get(id=lead_id)
            phone = lead.phone
        except Lead.DoesNotExist:
            return Response(
                {'error': 'Lead not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    else:
        try:
            client = Client.objects.get(id=client_id)
            phone = client.phone
        except Client.DoesNotExist:
            return Response(
                {'error': 'Client not found'},
                status=status.HTTP_404_NOT_FOUND
            )

    # Create the inbound message
    message = WhatsAppMessage.objects.create(
        direction='inbound',
        phone=phone,
        content=content,
        status='delivered',
        lead_id=lead_id,
        client_id=client_id,
    )

    return Response(
        WhatsAppMessageSerializer(message).data,
        status=status.HTTP_201_CREATED
    )

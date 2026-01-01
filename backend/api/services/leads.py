"""
Lead Service

Business logic for lead operations.
Every service function:
1. Uses database transaction (atomic)
2. Uses select_for_update() to prevent race conditions
3. Creates activity record
4. Updates timestamps
5. Returns updated entity
"""

from django.db import transaction
from core.models import Lead, Client, Document, LeadStatusChange, ClientStatusChange, CallLog, Note
from core.exceptions import InvalidStateError, ConversionError


class LeadService:
    """Service for lead business logic."""

    @staticmethod
    @transaction.atomic
    def drop_lead(lead_id: int, notes: str = '') -> Lead:
        """
        Drop a lead (terminal status).

        Args:
            lead_id: The lead ID to drop
            notes: Optional reason/notes for dropping

        Returns:
            Updated lead instance

        Raises:
            InvalidStateError: If lead is not in 'new' status
        """
        # Lock the row to prevent race conditions
        lead = Lead.objects.select_for_update().get(id=lead_id)

        if lead.status != 'new':
            raise InvalidStateError('lead', lead.status, ['new'])

        # Update lead status
        lead.status = 'dropped'
        lead.save()

        # Create activity record
        LeadStatusChange.objects.create(
            lead=lead,
            type='dropped',
            notes=notes
        )

        return lead

    @staticmethod
    @transaction.atomic
    def convert_lead(lead_id: int, notes: str = '') -> tuple[Lead, Client]:
        """
        Convert a lead to a client.

        Args:
            lead_id: The lead ID to convert
            notes: Optional handover notes

        Returns:
            Tuple of (updated lead, new client)

        Raises:
            InvalidStateError: If lead is not in 'new' status
        """
        # Lock the row to prevent race conditions
        lead = Lead.objects.select_for_update().get(id=lead_id)

        if lead.status != 'new':
            raise InvalidStateError('lead', lead.status, ['new'])

        # Create client from lead
        client = Client.objects.create(
            first_name=lead.first_name,
            last_name=lead.last_name,
            email=lead.email or '',
            phone=lead.phone,
            source=lead.source,
            converted_from_lead=lead,
            status='active'
        )

        # Create default document placeholders
        for doc_type in Document.DEFAULT_TYPES:
            Document.objects.create(
                client=client,
                type=doc_type,
                status='missing'
            )

        # Update lead status
        lead.status = 'converted'
        lead.save()

        # Create activity record for lead
        LeadStatusChange.objects.create(
            lead=lead,
            type='converted_to_client',
            notes=notes
        )

        # Create activity record for client (handover)
        ClientStatusChange.objects.create(
            client=client,
            type='converted_from_lead',
            notes=notes
        )

        return lead, client

    @staticmethod
    @transaction.atomic
    def log_call(lead_id: int, outcome: str, notes: str = '') -> CallLog:
        """
        Log a call for a lead.

        Args:
            lead_id: The lead ID to log call for
            outcome: Call outcome ('connected', 'noAnswer')
            notes: Optional call notes

        Returns:
            Created CallLog instance
        """
        lead = Lead.objects.select_for_update().get(id=lead_id)

        call_log = CallLog.objects.create(
            entity_type='lead',
            entity_id=lead.id,
            outcome=outcome,
            notes=notes
        )

        # Update entity's updated_at
        lead.save()

        return call_log

    @staticmethod
    @transaction.atomic
    def add_note(lead_id: int, content: str) -> Note:
        """
        Add a note to a lead.

        Args:
            lead_id: The lead ID to add note to
            content: Note content

        Returns:
            Created Note instance
        """
        lead = Lead.objects.select_for_update().get(id=lead_id)

        note = Note.objects.create(
            entity_type='lead',
            entity_id=lead.id,
            content=content
        )

        # Update entity's updated_at
        lead.save()

        return note

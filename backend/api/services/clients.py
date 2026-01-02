"""
Client Service

Business logic for client operations.
Every service function:
1. Uses database transaction (atomic)
2. Uses select_for_update() to prevent race conditions
3. Creates activity record
4. Updates timestamps
5. Returns updated entity
"""

from decimal import Decimal
from django.db import transaction
from core.models import Client, Document, Case, BankForm, BankProduct, ClientStatusChange, CaseStageChange, CallLog, Note
from core.exceptions import InvalidStateError


class ClientService:
    """Service for client business logic."""

    @staticmethod
    @transaction.atomic
    def mark_not_proceeding(client_id: int, notes: str = '') -> Client:
        """
        Mark client as withdrawn (terminal status).

        Args:
            client_id: The client ID to update
            notes: Optional reason/notes

        Returns:
            Updated client instance

        Raises:
            InvalidStateError: If client is not in 'active' status
        """
        # Lock the row to prevent race conditions
        client = Client.objects.select_for_update().get(id=client_id)

        if client.status != 'active':
            raise InvalidStateError('client', client.status, ['active'])

        # Update client status
        client.status = 'notProceeding'
        client.status_reason = notes
        client.save()

        # Create activity record
        ClientStatusChange.objects.create(
            client=client,
            type='not_proceeding',
            notes=notes
        )

        return client

    @staticmethod
    @transaction.atomic
    def mark_not_eligible(client_id: int, notes: str = '') -> Client:
        """
        Mark client as not eligible (terminal status).

        Args:
            client_id: The client ID to update
            notes: Optional reason/notes

        Returns:
            Updated client instance

        Raises:
            InvalidStateError: If client is not in 'active' status
        """
        # Lock the row to prevent race conditions
        client = Client.objects.select_for_update().get(id=client_id)

        if client.status != 'active':
            raise InvalidStateError('client', client.status, ['active'])

        # Update client status
        client.status = 'notEligible'
        client.eligibility_status = 'notEligible'
        client.status_reason = notes
        client.save()

        # Create activity record
        ClientStatusChange.objects.create(
            client=client,
            type='not_eligible',
            notes=notes
        )

        return client

    @staticmethod
    @transaction.atomic
    def create_case(
        client_id: int,
        case_type: str = 'residential',
        service_type: str = 'assisted',
        application_type: str = 'individual',
        mortgage_type: str = 'conventional',
        emirate: str = 'dubai',
        transaction_type: str = 'primaryPurchase',
        property_status: str = 'ready',
        mortgage_term_years: int = 25,
        mortgage_term_months: int = 0,
        loan_amount: Decimal = None,
        estimated_property_value: Decimal = None,
        bank_product_ids: list = None,
        notes: str = ''
    ) -> tuple[Client, Case]:
        """
        Create a case from a client (Client -> Case conversion).

        Args:
            client_id: The client ID to create case for
            case_type: 'residential' or 'commercial'
            service_type: 'assisted' or 'fullyPackaged'
            application_type: 'individual' or 'joint'
            mortgage_type: 'islamic' or 'conventional'
            emirate: Emirate for the property
            transaction_type: Type of transaction
            property_status: 'ready' or 'underConstruction'
            mortgage_term_years: Loan term in years
            mortgage_term_months: Additional months
            loan_amount: Loan amount (uses client's if not provided)
            estimated_property_value: Property value (uses client's if not provided)
            bank_product_ids: List of bank product IDs to add
            notes: Handover notes

        Returns:
            Tuple of (client, new case)

        Raises:
            InvalidStateError: If client is not in 'active' status
        """
        # Lock the row to prevent race conditions
        client = Client.objects.select_for_update().get(id=client_id)

        if client.status != 'active':
            raise InvalidStateError('client', client.status, ['active'])

        # Generate case ID
        case_id = Case.generate_case_id()

        # Use client data as defaults for loan amount and property value
        final_loan_amount = loan_amount or client.loan_amount or Decimal('0')
        final_property_value = estimated_property_value or client.estimated_property_value or Decimal('0')

        # Create the case
        case = Case.objects.create(
            case_id=case_id,
            client=client,
            case_type=case_type,
            service_type=service_type,
            application_type=application_type,
            mortgage_type=mortgage_type,
            emirate=emirate,
            loan_amount=final_loan_amount,
            transaction_type=transaction_type,
            mortgage_term_years=mortgage_term_years,
            mortgage_term_months=mortgage_term_months,
            estimated_property_value=final_property_value,
            property_status=property_status,
            stage='processing'
        )

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

        # Create initial stage change record
        CaseStageChange.objects.create(
            case=case,
            from_stage=None,
            to_stage='processing',
            notes=notes if notes else 'Case created'
        )

        # If handover notes were provided, also create a Note on the case
        if notes:
            Note.objects.create(
                entity_type='case',
                entity_id=case.id,
                content=f"[Handover Note] {notes}"
            )

        # Record client status change for audit trail (include handover notes)
        ClientStatusChange.objects.create(
            client=client,
            type='converted_to_case',
            notes=notes if notes else f'Case {case_id} created'
        )

        # Touch updated_at
        client.save()

        return client, case

    @staticmethod
    @transaction.atomic
    def log_call(client_id: int, outcome: str, notes: str = '') -> CallLog:
        """
        Log a call for a client.

        Args:
            client_id: The client ID to log call for
            outcome: Call outcome ('connected', 'noAnswer')
            notes: Optional call notes

        Returns:
            Created CallLog instance
        """
        client = Client.objects.select_for_update().get(id=client_id)

        call_log = CallLog.objects.create(
            entity_type='client',
            entity_id=client.id,
            outcome=outcome,
            notes=notes
        )

        # Update entity's updated_at
        client.save()

        return call_log

    @staticmethod
    @transaction.atomic
    def add_note(client_id: int, content: str) -> Note:
        """
        Add a note to a client.

        Args:
            client_id: The client ID to add note to
            content: Note content

        Returns:
            Created Note instance
        """
        client = Client.objects.select_for_update().get(id=client_id)

        note = Note.objects.create(
            entity_type='client',
            entity_id=client.id,
            content=content
        )

        # Update entity's updated_at
        client.save()

        return note

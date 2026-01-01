"""
Case Service

Business logic for case operations.
Every service function:
1. Uses database transaction (atomic)
2. Uses select_for_update() to prevent race conditions
3. Creates activity record
4. Updates timestamps
5. Returns updated entity
"""

from django.db import transaction
from django.utils import timezone
from core.models import Case, CaseStageChange, CallLog, Note
from core.exceptions import InvalidStateError, StageTransitionError


class CaseService:
    """Service for case business logic."""

    @staticmethod
    @transaction.atomic
    def advance_stage(case_id: int, notes: str = '') -> Case:
        """
        Advance case to the next stage (forward progression).

        Args:
            case_id: The case ID to advance
            notes: Optional notes for the stage change

        Returns:
            Updated case instance

        Raises:
            StageTransitionError: If case is already terminal or no next stage
        """
        # Lock the row to prevent race conditions
        case = Case.objects.select_for_update().get(id=case_id)

        if case.is_terminal():
            raise StageTransitionError(case.stage, 'next', 'Case is already in a terminal stage')

        next_stage = case.get_next_stage()
        if not next_stage:
            raise StageTransitionError(case.stage, 'next', 'No next stage available')

        from_stage = case.stage
        case.stage = next_stage
        case.save()

        # Create activity record
        CaseStageChange.objects.create(
            case=case,
            from_stage=from_stage,
            to_stage=next_stage,
            notes=notes
        )

        return case

    @staticmethod
    @transaction.atomic
    def decline(case_id: int, reason: str = '') -> Case:
        """
        Decline a case (terminal status).

        Args:
            case_id: The case ID to decline
            reason: Reason for declining

        Returns:
            Updated case instance

        Raises:
            StageTransitionError: If case is already terminal
        """
        # Lock the row to prevent race conditions
        case = Case.objects.select_for_update().get(id=case_id)

        if case.is_terminal():
            raise StageTransitionError(case.stage, 'declined', 'Case is already in a terminal stage')

        from_stage = case.stage
        case.stage = 'declined'
        case.stage_reason = reason
        case.save()

        # Create activity record
        CaseStageChange.objects.create(
            case=case,
            from_stage=from_stage,
            to_stage='declined',
            notes=reason
        )

        return case

    @staticmethod
    @transaction.atomic
    def withdraw(case_id: int, reason: str = '') -> Case:
        """
        Withdraw a case (terminal status).

        Args:
            case_id: The case ID to withdraw
            reason: Reason for withdrawing

        Returns:
            Updated case instance

        Raises:
            StageTransitionError: If case is already terminal
        """
        # Lock the row to prevent race conditions
        case = Case.objects.select_for_update().get(id=case_id)

        if case.is_terminal():
            raise StageTransitionError(case.stage, 'withdrawn', 'Case is already in a terminal stage')

        from_stage = case.stage
        case.stage = 'withdrawn'
        case.stage_reason = reason
        case.save()

        # Create activity record
        CaseStageChange.objects.create(
            case=case,
            from_stage=from_stage,
            to_stage='withdrawn',
            notes=reason
        )

        return case

    @staticmethod
    @transaction.atomic
    def set_stage(case_id: int, new_stage: str, notes: str = '') -> Case:
        """
        Set case stage directly (for Kanban drag and drop).

        Args:
            case_id: The case ID to update
            new_stage: The new stage to set
            notes: Optional notes for the stage change

        Returns:
            Updated case instance
        """
        # Lock the row to prevent race conditions
        case = Case.objects.select_for_update().get(id=case_id)

        # Don't update if same stage
        if case.stage == new_stage:
            return case

        from_stage = case.stage
        case.stage = new_stage
        case.save()

        # Create activity record
        CaseStageChange.objects.create(
            case=case,
            from_stage=from_stage,
            to_stage=new_stage,
            notes=notes or 'Stage changed via kanban'
        )

        return case

    @staticmethod
    @transaction.atomic
    def log_call(case_id: int, outcome: str, notes: str = '') -> CallLog:
        """
        Log a call for a case.

        Args:
            case_id: The case ID to log call for
            outcome: Call outcome ('connected', 'noAnswer')
            notes: Optional call notes

        Returns:
            Created CallLog instance
        """
        case = Case.objects.select_for_update().get(id=case_id)

        call_log = CallLog.objects.create(
            entity_type='case',
            entity_id=case.id,
            outcome=outcome,
            notes=notes
        )

        # Update entity's updated_at
        case.save()

        return call_log

    @staticmethod
    @transaction.atomic
    def add_note(case_id: int, content: str) -> Note:
        """
        Add a note to a case.

        Args:
            case_id: The case ID to add note to
            content: Note content

        Returns:
            Created Note instance
        """
        case = Case.objects.select_for_update().get(id=case_id)

        note = Note.objects.create(
            entity_type='case',
            entity_id=case.id,
            content=content
        )

        # Update entity's updated_at
        case.save()

        return note

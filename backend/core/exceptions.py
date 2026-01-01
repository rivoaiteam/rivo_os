"""
Custom Exceptions for Rivo OS

Domain-specific exceptions for clear error handling.
All exceptions inherit from base classes that map to HTTP status codes.
"""

from rest_framework.exceptions import APIException
from rest_framework import status


class RivoException(APIException):
    """Base exception for all Rivo domain errors"""
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = 'A business rule was violated.'
    default_code = 'business_error'


class InvalidStateError(RivoException):
    """Entity is in wrong state for the requested operation"""
    default_detail = 'Entity is in an invalid state for this operation.'
    default_code = 'invalid_state'

    def __init__(self, entity_type: str, current_state: str, required_states: list[str] = None):
        if required_states:
            detail = f'{entity_type.title()} is in "{current_state}" state. Required: {", ".join(required_states)}.'
        else:
            detail = f'{entity_type.title()} cannot perform this action in "{current_state}" state.'
        super().__init__(detail=detail)


class AlreadyExistsError(RivoException):
    """Resource already exists"""
    status_code = status.HTTP_409_CONFLICT
    default_detail = 'Resource already exists.'
    default_code = 'already_exists'


class NotFoundError(RivoException):
    """Resource not found"""
    status_code = status.HTTP_404_NOT_FOUND
    default_detail = 'Resource not found.'
    default_code = 'not_found'


class ValidationError(RivoException):
    """Input validation failed"""
    default_detail = 'Validation failed.'
    default_code = 'validation_error'


class ConversionError(RivoException):
    """Entity conversion failed"""
    default_detail = 'Conversion failed.'
    default_code = 'conversion_error'

    def __init__(self, from_entity: str, to_entity: str, reason: str = None):
        detail = f'Cannot convert {from_entity} to {to_entity}.'
        if reason:
            detail += f' Reason: {reason}'
        super().__init__(detail=detail)


class StageTransitionError(RivoException):
    """Invalid stage transition"""
    default_detail = 'Invalid stage transition.'
    default_code = 'stage_transition_error'

    def __init__(self, current_stage: str, target_stage: str = None, reason: str = None):
        if target_stage:
            detail = f'Cannot transition from "{current_stage}" to "{target_stage}".'
        else:
            detail = f'Cannot transition from "{current_stage}".'
        if reason:
            detail += f' {reason}'
        super().__init__(detail=detail)

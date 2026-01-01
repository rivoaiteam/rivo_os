"""
Service Layer

Business logic for leads, clients, and cases.
ViewSets are thin - logic lives in services.
"""

from .leads import LeadService
from .clients import ClientService
from .cases import CaseService

__all__ = ['LeadService', 'ClientService', 'CaseService']

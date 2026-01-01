"""
API URLs for Rivo OS.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views.leads import LeadViewSet
from .views.clients import ClientViewSet
from .views.cases import CaseViewSet
from .views.settings import (
    ChannelViewSet,
    SourceViewSet,
    SubSourceViewSet,
    CampaignViewSet,
    UserViewSet,
    BankProductViewSet,
    EiborRateViewSet,
    eibor_rates_latest,
    system_settings,
)
from .views.whatsapp import whatsapp_conversations, whatsapp_messages, whatsapp_send, whatsapp_simulate_inbound

router = DefaultRouter()

# Register viewsets
router.register(r'leads', LeadViewSet, basename='lead')
router.register(r'clients', ClientViewSet, basename='client')
router.register(r'cases', CaseViewSet, basename='case')
router.register(r'channels', ChannelViewSet, basename='channel')
router.register(r'sources', SourceViewSet, basename='source')
router.register(r'sub-sources', SubSourceViewSet, basename='sub-source')
router.register(r'campaigns', CampaignViewSet, basename='campaign')
router.register(r'users', UserViewSet, basename='user')
router.register(r'bank-products', BankProductViewSet, basename='bank-product')
router.register(r'eibor-rates', EiborRateViewSet, basename='eibor-rate')

urlpatterns = [
    # Custom endpoints before router to ensure they're matched first
    path('eibor-rates/latest/', eibor_rates_latest, name='eibor-rates-latest'),
    path('system-settings/', system_settings, name='system-settings'),
    # WhatsApp endpoints
    path('whatsapp/conversations/', whatsapp_conversations, name='whatsapp-conversations'),
    path('whatsapp/messages/', whatsapp_messages, name='whatsapp-messages'),
    path('whatsapp/send/', whatsapp_send, name='whatsapp-send'),
    path('whatsapp/simulate-inbound/', whatsapp_simulate_inbound, name='whatsapp-simulate-inbound'),
    path('', include(router.urls)),
]

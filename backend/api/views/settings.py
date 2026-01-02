"""
Settings Views (Channels, Sources, SubSources, Campaigns, Users, Bank Products, System Settings)
"""

from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Q

from core.models import Channel, Source, SubSource, Campaign, User, BankProduct, EiborRate, SystemSettings
from api.pagination import StandardPagination
from api.serializers.settings import (
    ChannelSerializer,
    SourceSerializer,
    SubSourceSerializer,
    CampaignSerializer,
    UserSerializer,
    UserCreateSerializer,
    UserUpdateSerializer,
    BankProductSerializer,
    EiborRateSerializer,
    SystemSettingsSerializer,
)


class ChannelViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Channel CRUD operations.
    """

    permission_classes = [IsAuthenticated]
    pagination_class = None
    queryset = Channel.objects.all()
    serializer_class = ChannelSerializer


class SourceViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Source CRUD operations.
    """

    permission_classes = [IsAuthenticated]
    pagination_class = None
    serializer_class = SourceSerializer

    def get_queryset(self):
        queryset = Source.objects.all()
        channel_id = self.request.query_params.get('channel_id')
        if channel_id:
            queryset = queryset.filter(channel_id=channel_id)
        return queryset


class SubSourceViewSet(viewsets.ModelViewSet):
    """
    ViewSet for SubSource CRUD operations.
    """

    permission_classes = [IsAuthenticated]
    pagination_class = None
    serializer_class = SubSourceSerializer

    def get_queryset(self):
        queryset = SubSource.objects.all()
        source_id = self.request.query_params.get('source_id')
        if source_id:
            queryset = queryset.filter(source_id=source_id)
        return queryset


class CampaignViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Campaign CRUD operations.
    """

    permission_classes = [IsAuthenticated]
    pagination_class = None
    queryset = Campaign.objects.all()
    serializer_class = CampaignSerializer


class UserViewSet(viewsets.ModelViewSet):
    """
    ViewSet for User CRUD operations.
    """

    permission_classes = [IsAuthenticated]
    pagination_class = None
    queryset = User.objects.all()

    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return UserUpdateSerializer
        return UserSerializer


class BankProductViewSet(viewsets.ModelViewSet):
    """
    ViewSet for BankProduct CRUD operations with filtering.
    """

    permission_classes = [IsAuthenticated]
    pagination_class = StandardPagination
    serializer_class = BankProductSerializer
    queryset = BankProduct.objects.all()

    def get_queryset(self):
        queryset = BankProduct.objects.all()

        # Filter by active status
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')

        # Filter by bank name
        bank_name = self.request.query_params.get('bank_name')
        if bank_name:
            queryset = queryset.filter(bank_name__icontains=bank_name)

        # Filter by mortgage type
        mortgage_type = self.request.query_params.get('mortgage_type')
        if mortgage_type:
            queryset = queryset.filter(type_of_mortgage=mortgage_type)

        # Filter by employment type
        employment_type = self.request.query_params.get('employment_type')
        if employment_type:
            queryset = queryset.filter(
                Q(type_of_employment=employment_type) | Q(type_of_employment='ALL')
            )

        # Filter by transaction type
        transaction_type = self.request.query_params.get('transaction_type')
        if transaction_type:
            queryset = queryset.filter(
                Q(type_of_transaction=transaction_type) |
                Q(type_of_transaction='PRIMARY/RESALE/HANDOVER')
            )

        # Filter by residency status
        residency = self.request.query_params.get('residency')
        if residency:
            queryset = queryset.filter(
                Q(citizen_state=residency) | Q(citizen_state='ALL')
            )

        # Filter by interest rate type
        rate_type = self.request.query_params.get('rate_type')
        if rate_type:
            queryset = queryset.filter(interest_rate_type=rate_type)

        # Filter by exclusivity
        is_exclusive = self.request.query_params.get('is_exclusive')
        if is_exclusive is not None:
            queryset = queryset.filter(is_exclusive=is_exclusive.lower() == 'true')

        # Filter by minimum LTV
        ltv_min = self.request.query_params.get('ltv_min')
        if ltv_min:
            try:
                ltv_value = float(ltv_min)
                queryset = queryset.filter(loan_to_value_ratio__gte=ltv_value)
            except ValueError:
                pass

        return queryset


class EiborRateViewSet(viewsets.ModelViewSet):
    """
    ViewSet for EiborRate CRUD operations.
    """

    permission_classes = [IsAuthenticated]
    pagination_class = None
    queryset = EiborRate.objects.all()
    serializer_class = EiborRateSerializer


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def eibor_rates_latest(request):
    """
    GET: Retrieve the latest EIBOR rates for all terms (single query)
    """
    from django.db import connection

    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT term, rate, date FROM eibor_rates
            WHERE date = (SELECT MAX(date) FROM eibor_rates)
        """)
        rows = cursor.fetchall()

    if not rows:
        return Response({
            'overnight': None,
            'oneWeek': None,
            'oneMonth': None,
            'threeMonths': None,
            'sixMonths': None,
            'oneYear': None,
            'lastUpdated': None,
        })

    rate_map = {row[0]: float(row[1]) for row in rows}
    latest_date = rows[0][2]

    return Response({
        'overnight': rate_map.get('overnight'),
        'oneWeek': rate_map.get('1_week'),
        'oneMonth': rate_map.get('1_month'),
        'threeMonths': rate_map.get('3_months'),
        'sixMonths': rate_map.get('6_months'),
        'oneYear': rate_map.get('1_year'),
        'lastUpdated': latest_date.isoformat() if latest_date else None,
    })


@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def system_settings(request):
    """
    GET: Retrieve system settings
    PATCH: Update system settings
    """
    # Use .first() instead of get_or_create to avoid extra query
    settings = SystemSettings.objects.first()
    if not settings:
        settings = SystemSettings.objects.create(pk=1)

    if request.method == 'GET':
        serializer = SystemSettingsSerializer(settings)
        return Response(serializer.data)

    elif request.method == 'PATCH':
        serializer = SystemSettingsSerializer(settings, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

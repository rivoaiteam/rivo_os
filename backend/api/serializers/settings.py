"""
Settings Serializers (Channels, Sources, SubSources, Campaigns, Users, Bank Products, System Settings)
"""

from rest_framework import serializers
from core.models import Channel, Source, SubSource, Campaign, User, BankProduct, EiborRate, SystemSettings


class SystemSettingsSerializer(serializers.ModelSerializer):
    """Serializer for SystemSettings model"""

    systemPassword = serializers.CharField(source='system_password', required=False, allow_blank=True)
    updatedAt = serializers.DateTimeField(source='updated_at', read_only=True)

    class Meta:
        model = SystemSettings
        fields = ['systemPassword', 'updatedAt']


class ChannelSerializer(serializers.ModelSerializer):
    """Serializer for Channel model"""

    trustLevel = serializers.CharField(source='trust_level', read_only=True)

    class Meta:
        model = Channel
        fields = ['id', 'name', 'trustLevel']
        read_only_fields = ['id', 'name', 'trustLevel']


class SourceSerializer(serializers.ModelSerializer):
    """Serializer for Source model - no status, just a container"""

    channelId = serializers.CharField(source='channel_id')
    contactPhone = serializers.CharField(source='contact_phone', required=False, allow_null=True, allow_blank=True)
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)

    class Meta:
        model = Source
        fields = ['id', 'channelId', 'name', 'contactPhone', 'createdAt']
        read_only_fields = ['id', 'createdAt']


class SubSourceSerializer(serializers.ModelSerializer):
    """Serializer for SubSource model with status toggle and SLA"""

    sourceId = serializers.UUIDField(source='source_id')
    sourceName = serializers.CharField(source='source.name', read_only=True)
    channelId = serializers.CharField(source='source.channel_id', read_only=True)
    contactPhone = serializers.CharField(source='contact_phone', required=False, allow_null=True, allow_blank=True)
    defaultSlaMin = serializers.IntegerField(source='default_sla_min', required=False, allow_null=True)
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)

    class Meta:
        model = SubSource
        fields = ['id', 'sourceId', 'sourceName', 'channelId', 'name', 'contactPhone', 'status', 'defaultSlaMin', 'createdAt']
        read_only_fields = ['id', 'sourceName', 'channelId', 'createdAt']


class CampaignSerializer(serializers.ModelSerializer):
    """Serializer for Campaign model"""

    createdAt = serializers.DateTimeField(source='created_at', read_only=True)

    class Meta:
        model = Campaign
        fields = ['id', 'name', 'status', 'createdAt']
        read_only_fields = ['id', 'createdAt']


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model"""

    firstName = serializers.CharField(source='first_name')
    lastName = serializers.CharField(source='last_name')
    dateJoined = serializers.DateTimeField(source='date_joined', read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'firstName', 'lastName', 'status', 'dateJoined']
        read_only_fields = ['id', 'dateJoined']


class UserCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a User - uses system password for auth"""

    firstName = serializers.CharField(source='first_name')
    lastName = serializers.CharField(source='last_name', required=False, allow_blank=True)
    password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = ['username', 'email', 'firstName', 'lastName', 'password', 'status']

    def create(self, validated_data):
        # Password field is ignored - we use system password for auth
        validated_data.pop('password', None)
        user = User(**validated_data)
        # Set unusable password since we use system password
        user.set_unusable_password()
        user.save()
        return user


class UserUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating a User"""

    firstName = serializers.CharField(source='first_name', required=False)
    lastName = serializers.CharField(source='last_name', required=False)
    password = serializers.CharField(write_only=True, min_length=6, required=False)

    class Meta:
        model = User
        fields = ['email', 'firstName', 'lastName', 'password', 'status']

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance


class BankProductSerializer(serializers.ModelSerializer):
    """Serializer for BankProduct model"""

    # Basic info
    bankName = serializers.CharField(source='bank_name')
    bankLogo = serializers.URLField(source='bank_logo', required=False, allow_null=True, allow_blank=True)
    bankIcon = serializers.URLField(source='bank_icon', required=False, allow_null=True, allow_blank=True)

    # Rate information
    eiborRate = serializers.DecimalField(source='eibor_rate', max_digits=6, decimal_places=3, required=False, allow_null=True)
    eiborType = serializers.CharField(source='eibor_type', required=False)
    variableRateAddition = serializers.DecimalField(source='variable_rate_addition', max_digits=6, decimal_places=3, required=False)
    minimumRate = serializers.DecimalField(source='minimum_rate', max_digits=6, decimal_places=3, required=False)
    fixedUntil = serializers.IntegerField(source='fixed_until', required=False)
    fixedRate = serializers.DecimalField(source='fixed_rate', max_digits=6, decimal_places=3, required=False)
    followOnRate = serializers.DecimalField(source='follow_on_rate', max_digits=6, decimal_places=3, required=False, allow_null=True)
    followOnRateType = serializers.CharField(source='follow_on_rate_type', required=False)
    interestRate = serializers.DecimalField(source='interest_rate', max_digits=6, decimal_places=3, required=False, allow_null=True)
    interestRateType = serializers.CharField(source='interest_rate_type', required=False)

    # Product classification
    typeOfMortgage = serializers.CharField(source='type_of_mortgage', required=False)
    typeOfAccount = serializers.CharField(source='type_of_account', required=False, allow_null=True, allow_blank=True)
    typeOfEmployment = serializers.CharField(source='type_of_employment', required=False)
    typeOfTransaction = serializers.CharField(source='type_of_transaction', required=False)
    citizenState = serializers.CharField(source='citizen_state', required=False)

    # Insurance
    lifeInsurance = serializers.DecimalField(source='life_insurance', max_digits=6, decimal_places=3, required=False)
    lifeInsurancePaymentPeriod = serializers.CharField(source='life_insurance_payment_period', required=False)
    propertyInsurance = serializers.DecimalField(source='property_insurance', max_digits=6, decimal_places=3, required=False)
    propertyInsurancePaymentPeriod = serializers.CharField(source='property_insurance_payment_period', required=False)

    # Fees
    homeValuationFee = serializers.DecimalField(source='home_valuation_fee', max_digits=10, decimal_places=2, required=False)
    preApprovalFee = serializers.DecimalField(source='pre_approval_fee', max_digits=10, decimal_places=2, required=False)
    mortgageProcessingFee = serializers.DecimalField(source='mortgage_processing_fee', max_digits=6, decimal_places=2, required=False)
    mortgageProcessingFeeAsAmount = serializers.DecimalField(source='mortgage_processing_fee_as_amount', max_digits=10, decimal_places=2, required=False, allow_null=True)
    minimumMortgageProcessingFee = serializers.DecimalField(source='minimum_mortgage_processing_fee', max_digits=10, decimal_places=2, required=False)
    buyoutProcessingFee = serializers.DecimalField(source='buyout_processing_fee', max_digits=10, decimal_places=2, required=False)

    # Terms and conditions
    overpaymentFee = serializers.CharField(source='overpayment_fee', required=False, allow_null=True, allow_blank=True)
    earlySettlementFee = serializers.CharField(source='early_settlement_fee', required=False, allow_null=True, allow_blank=True)

    # LTV and limits
    loanToValueRatio = serializers.DecimalField(source='loan_to_value_ratio', max_digits=5, decimal_places=2, required=False)
    loanToValueThreshold = serializers.DecimalField(source='loan_to_value_threshold', max_digits=15, decimal_places=2, required=False, allow_null=True)
    maximumLengthOfMortgage = serializers.IntegerField(source='maximum_length_of_mortgage', required=False)
    mortgageContractMonths = serializers.IntegerField(source='mortgage_contract_months', required=False)

    # Monthly payment
    monthlyPayment = serializers.DecimalField(source='monthly_payment', max_digits=12, decimal_places=2, required=False, allow_null=True)

    # Additional features
    hasFeeFinancing = serializers.BooleanField(source='has_fee_financing', required=False)
    includesAgencyFees = serializers.BooleanField(source='includes_agency_fees', required=False)
    includesGovernmentFees = serializers.BooleanField(source='includes_government_fees', required=False)
    isExclusive = serializers.BooleanField(source='is_exclusive', required=False)

    # Customer segments
    customerSegments = serializers.JSONField(source='customer_segments', required=False)

    # Additional info
    additionalInformation = serializers.CharField(source='additional_information', required=False, allow_null=True, allow_blank=True)
    description = serializers.CharField(required=False, allow_null=True, allow_blank=True)

    # Status
    isActive = serializers.BooleanField(source='is_active', required=False)
    expiryDate = serializers.DateField(source='expiry_date', required=False, allow_null=True)

    # Timestamps
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)
    updatedAt = serializers.DateTimeField(source='updated_at', read_only=True)

    class Meta:
        model = BankProduct
        fields = [
            'id', 'bankName', 'bankLogo', 'bankIcon',
            # Rate info
            'eiborRate', 'eiborType', 'variableRateAddition', 'minimumRate',
            'fixedUntil', 'fixedRate', 'followOnRate', 'followOnRateType',
            'interestRate', 'interestRateType',
            # Classification
            'typeOfMortgage', 'typeOfAccount', 'typeOfEmployment', 'typeOfTransaction', 'citizenState',
            # Insurance
            'lifeInsurance', 'lifeInsurancePaymentPeriod', 'propertyInsurance', 'propertyInsurancePaymentPeriod',
            # Fees
            'homeValuationFee', 'preApprovalFee', 'mortgageProcessingFee', 'mortgageProcessingFeeAsAmount',
            'minimumMortgageProcessingFee', 'buyoutProcessingFee',
            # Terms
            'overpaymentFee', 'earlySettlementFee',
            # LTV/Limits
            'loanToValueRatio', 'loanToValueThreshold', 'maximumLengthOfMortgage', 'mortgageContractMonths',
            # Payment
            'monthlyPayment',
            # Features
            'hasFeeFinancing', 'includesAgencyFees', 'includesGovernmentFees', 'isExclusive',
            # Segments
            'customerSegments',
            # Additional
            'additionalInformation', 'description',
            # Status
            'isActive', 'expiryDate',
            # Timestamps
            'createdAt', 'updatedAt'
        ]
        read_only_fields = ['id', 'createdAt', 'updatedAt']


class EiborRateSerializer(serializers.ModelSerializer):
    """Serializer for EiborRate model"""

    class Meta:
        model = EiborRate
        fields = ['id', 'term', 'rate', 'date', 'created_at']
        read_only_fields = ['id', 'created_at']


class EiborRatesResponseSerializer(serializers.Serializer):
    """Serializer for EIBOR rates response grouped by term"""

    overnight = serializers.DecimalField(max_digits=6, decimal_places=3, allow_null=True)
    oneWeek = serializers.DecimalField(max_digits=6, decimal_places=3, allow_null=True, source='1_week')
    oneMonth = serializers.DecimalField(max_digits=6, decimal_places=3, allow_null=True, source='1_month')
    threeMonths = serializers.DecimalField(max_digits=6, decimal_places=3, allow_null=True, source='3_months')
    sixMonths = serializers.DecimalField(max_digits=6, decimal_places=3, allow_null=True, source='6_months')
    oneYear = serializers.DecimalField(max_digits=6, decimal_places=3, allow_null=True, source='1_year')
    lastUpdated = serializers.DateField(allow_null=True)

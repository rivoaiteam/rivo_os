"""
Client Serializers
"""

from rest_framework import serializers
from core.models import Client, Document, CallLog, Note, ClientStatusChange, Campaign, BankProduct, SubSource
from api.serializers.common import CallLogSerializer, NoteSerializer, LogCallSerializer, AddNoteSerializer


class ClientStatusChangeSerializer(serializers.ModelSerializer):
    """Serializer for ClientStatusChange model"""

    class Meta:
        model = ClientStatusChange
        fields = ['id', 'type', 'notes', 'timestamp']
        read_only_fields = ['id', 'timestamp']


class DocumentSerializer(serializers.ModelSerializer):
    """Serializer for Document model"""

    uploadedAt = serializers.DateTimeField(source='uploaded_at', read_only=True)
    fileUrl = serializers.URLField(source='file_url', read_only=True)

    class Meta:
        model = Document
        fields = ['id', 'type', 'status', 'fileUrl', 'uploadedAt']
        read_only_fields = ['id']


class ClientListSerializer(serializers.ModelSerializer):
    """Serializer for Client list view - minimal data for fast loading"""

    firstName = serializers.CharField(source='first_name')
    lastName = serializers.CharField(source='last_name')
    eligibilityStatus = serializers.CharField(source='eligibility_status', read_only=True)
    estimatedDbr = serializers.DecimalField(source='estimated_dbr', max_digits=5, decimal_places=2, read_only=True)
    estimatedLtv = serializers.DecimalField(source='estimated_ltv', max_digits=5, decimal_places=2, read_only=True)
    maxLoanAmount = serializers.DecimalField(source='max_loan_amount', max_digits=12, decimal_places=2, read_only=True)
    sourceId = serializers.UUIDField(source='source_id', read_only=True)
    sourceDisplay = serializers.ReadOnlyField(source='source_display')
    sourceSlaMin = serializers.SerializerMethodField()
    sourceCampaign = serializers.SerializerMethodField()
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)
    updatedAt = serializers.DateTimeField(source='updated_at', read_only=True)
    documentsCount = serializers.SerializerMethodField()
    caseId = serializers.SerializerMethodField()
    hasActivity = serializers.SerializerMethodField()

    class Meta:
        model = Client
        fields = [
            'id', 'firstName', 'lastName', 'email', 'phone',
            'eligibilityStatus', 'estimatedDbr', 'estimatedLtv', 'maxLoanAmount',
            'sourceId', 'sourceDisplay', 'sourceSlaMin', 'sourceCampaign',
            'status', 'createdAt', 'updatedAt', 'documentsCount', 'caseId', 'hasActivity'
        ]

    def get_sourceSlaMin(self, obj):
        """Returns the SLA in minutes from the sub-source - uses prefetched data"""
        if obj.source:
            return obj.source.default_sla_min
        return None

    def get_sourceCampaign(self, obj):
        """Uses prefetched source_campaign"""
        return obj.source_campaign.name if obj.source_campaign else None

    def get_documentsCount(self, obj):
        """Uses prefetched documents"""
        docs = list(obj.documents.all())
        uploaded = sum(1 for d in docs if d.status in ('uploaded', 'verified'))
        total = sum(1 for d in docs if d.status != 'notApplicable')
        return f"{uploaded}/{total}"

    def get_caseId(self, obj):
        """Returns list of cases with bank info - uses prefetched cases"""
        cases = list(obj.cases.all())
        if not cases:
            return None

        # Get all unique bank names and fetch icons in one query
        bank_names = [c.bank_name for c in cases if c.bank_name]
        bank_icons = {}
        if bank_names:
            products = BankProduct.objects.filter(bank_name__in=bank_names).values('bank_name', 'bank_icon')
            bank_icons = {p['bank_name']: p['bank_icon'] for p in products}

        result = []
        for case in cases:
            result.append({
                'id': case.id,
                'caseId': case.case_id,
                'stage': case.stage,
                'bankName': case.bank_name,
                'bankIcon': bank_icons.get(case.bank_name)
            })
        return result

    def _get_prefetched_call_logs(self, obj):
        """Get call logs from prefetched context or fallback to query"""
        prefetched = self.context.get('prefetched_call_logs')
        if prefetched is not None:
            return prefetched.get(obj.id, [])
        return list(CallLog.objects.filter(entity_type='client', entity_id=obj.id))

    def _get_prefetched_notes(self, obj):
        """Get notes from prefetched context or fallback to query"""
        prefetched = self.context.get('prefetched_notes')
        if prefetched is not None:
            return prefetched.get(obj.id, [])
        return list(Note.objects.filter(entity_type='client', entity_id=obj.id))

    def get_hasActivity(self, obj):
        """Returns True if any action has been taken - uses prefetched data"""
        call_logs = self._get_prefetched_call_logs(obj)
        if call_logs:
            return True
        notes = self._get_prefetched_notes(obj)
        if notes:
            return True
        # Uses prefetched status_changes
        if list(obj.status_changes.all()):
            return True
        return False


class ClientDetailSerializer(serializers.ModelSerializer):
    """Serializer for Client detail view - full data with activity"""

    firstName = serializers.CharField(source='first_name')
    lastName = serializers.CharField(source='last_name')
    residencyStatus = serializers.CharField(source='residency_status')
    dateOfBirth = serializers.DateField(source='date_of_birth', required=False, allow_null=True)
    employmentStatus = serializers.CharField(source='employment_status')
    monthlySalary = serializers.DecimalField(source='monthly_salary', max_digits=12, decimal_places=2)
    monthlyLiabilities = serializers.DecimalField(source='monthly_liabilities', max_digits=12, decimal_places=2, required=False, allow_null=True)
    loanAmount = serializers.DecimalField(source='loan_amount', max_digits=12, decimal_places=2, required=False, allow_null=True)
    estimatedPropertyValue = serializers.DecimalField(source='estimated_property_value', max_digits=12, decimal_places=2, required=False, allow_null=True)
    eligibilityStatus = serializers.CharField(source='eligibility_status', read_only=True)
    estimatedDbr = serializers.DecimalField(source='estimated_dbr', max_digits=5, decimal_places=2, read_only=True)
    estimatedLtv = serializers.DecimalField(source='estimated_ltv', max_digits=5, decimal_places=2, read_only=True)
    maxLoanAmount = serializers.DecimalField(source='max_loan_amount', max_digits=12, decimal_places=2, read_only=True)
    sourceId = serializers.UUIDField(source='source_id', read_only=True)
    sourceDisplay = serializers.ReadOnlyField(source='source_display')
    sourceCampaign = serializers.SerializerMethodField()
    statusReason = serializers.CharField(source='status_reason', required=False, allow_null=True, allow_blank=True)
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)
    updatedAt = serializers.DateTimeField(source='updated_at', read_only=True)

    documents = DocumentSerializer(many=True, read_only=True)
    callLogs = serializers.SerializerMethodField()
    notes = serializers.SerializerMethodField()
    statusChanges = serializers.SerializerMethodField()
    cases = serializers.SerializerMethodField()

    class Meta:
        model = Client
        fields = [
            'id', 'firstName', 'lastName', 'email', 'phone',
            'residencyStatus', 'dateOfBirth', 'nationality', 'employmentStatus',
            'monthlySalary', 'monthlyLiabilities', 'loanAmount', 'estimatedPropertyValue',
            'eligibilityStatus', 'estimatedDbr', 'estimatedLtv', 'maxLoanAmount',
            'sourceId', 'sourceDisplay', 'sourceCampaign', 'status', 'statusReason',
            'createdAt', 'updatedAt',
            'documents', 'callLogs', 'notes', 'statusChanges', 'cases'
        ]

    def get_sourceCampaign(self, obj):
        """Uses prefetched source_campaign"""
        return obj.source_campaign.name if obj.source_campaign else None

    def _get_prefetched_call_logs(self, obj):
        """Get call logs from prefetched context or fallback to query"""
        prefetched = self.context.get('prefetched_call_logs')
        if prefetched is not None:
            return prefetched.get(obj.id, [])
        return list(CallLog.objects.filter(entity_type='client', entity_id=obj.id))

    def _get_prefetched_notes(self, obj):
        """Get notes from prefetched context or fallback to query"""
        prefetched = self.context.get('prefetched_notes')
        if prefetched is not None:
            return prefetched.get(obj.id, [])
        return list(Note.objects.filter(entity_type='client', entity_id=obj.id))

    def get_callLogs(self, obj):
        call_logs = self._get_prefetched_call_logs(obj)
        return CallLogSerializer(call_logs, many=True).data

    def get_notes(self, obj):
        notes = self._get_prefetched_notes(obj)
        return NoteSerializer(notes, many=True).data

    def get_statusChanges(self, obj):
        """Uses prefetched status_changes"""
        return ClientStatusChangeSerializer(obj.status_changes.all(), many=True).data

    def get_cases(self, obj):
        """Returns list of cases - uses prefetched cases"""
        cases = list(obj.cases.all())
        if not cases:
            return []

        # Get all unique bank names and fetch icons in one query
        bank_names = [c.bank_name for c in cases if c.bank_name]
        bank_icons = {}
        if bank_names:
            products = BankProduct.objects.filter(bank_name__in=bank_names).values('bank_name', 'bank_icon')
            bank_icons = {p['bank_name']: p['bank_icon'] for p in products}

        result = []
        for case in cases:
            result.append({
                'id': case.id,
                'caseId': case.case_id,
                'stage': case.stage,
                'bankName': case.bank_name,
                'bankIcon': bank_icons.get(case.bank_name)
            })
        return result


class ClientCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a Client"""

    firstName = serializers.CharField(source='first_name')
    lastName = serializers.CharField(source='last_name')
    residencyStatus = serializers.CharField(source='residency_status', required=False)
    dateOfBirth = serializers.DateField(source='date_of_birth', required=False, allow_null=True)
    employmentStatus = serializers.CharField(source='employment_status', required=False)
    monthlySalary = serializers.DecimalField(source='monthly_salary', max_digits=12, decimal_places=2, required=False)
    monthlyLiabilities = serializers.DecimalField(source='monthly_liabilities', max_digits=12, decimal_places=2, required=False, allow_null=True)
    loanAmount = serializers.DecimalField(source='loan_amount', max_digits=12, decimal_places=2, required=False, allow_null=True)
    estimatedPropertyValue = serializers.DecimalField(source='estimated_property_value', max_digits=12, decimal_places=2, required=False, allow_null=True)
    sourceId = serializers.PrimaryKeyRelatedField(
        source='source',
        queryset=SubSource.objects.all(),
        required=False,
        allow_null=True
    )
    sourceCampaignId = serializers.PrimaryKeyRelatedField(
        source='source_campaign',
        queryset=Campaign.objects.all(),
        required=False,
        allow_null=True
    )

    class Meta:
        model = Client
        fields = [
            'firstName', 'lastName', 'email', 'phone',
            'residencyStatus', 'dateOfBirth', 'nationality', 'employmentStatus',
            'monthlySalary', 'monthlyLiabilities', 'loanAmount', 'estimatedPropertyValue',
            'sourceId', 'sourceCampaignId'
        ]



class ClientUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating a Client"""

    firstName = serializers.CharField(source='first_name', required=False)
    lastName = serializers.CharField(source='last_name', required=False)
    residencyStatus = serializers.CharField(source='residency_status', required=False)
    dateOfBirth = serializers.DateField(source='date_of_birth', required=False, allow_null=True)
    employmentStatus = serializers.CharField(source='employment_status', required=False)
    monthlySalary = serializers.DecimalField(source='monthly_salary', max_digits=12, decimal_places=2, required=False)
    monthlyLiabilities = serializers.DecimalField(source='monthly_liabilities', max_digits=12, decimal_places=2, required=False, allow_null=True)
    loanAmount = serializers.DecimalField(source='loan_amount', max_digits=12, decimal_places=2, required=False, allow_null=True)
    estimatedPropertyValue = serializers.DecimalField(source='estimated_property_value', max_digits=12, decimal_places=2, required=False, allow_null=True)
    sourceId = serializers.PrimaryKeyRelatedField(
        source='source',
        queryset=SubSource.objects.all(),
        required=False,
        allow_null=True
    )

    class Meta:
        model = Client
        fields = [
            'firstName', 'lastName', 'email', 'phone',
            'residencyStatus', 'dateOfBirth', 'nationality', 'employmentStatus',
            'monthlySalary', 'monthlyLiabilities', 'loanAmount', 'estimatedPropertyValue',
            'sourceId'
        ]


class MarkNotProceedingSerializer(serializers.Serializer):
    """Serializer for marking client as not proceeding"""

    notes = serializers.CharField(required=False, allow_blank=True)


class MarkNotEligibleSerializer(serializers.Serializer):
    """Serializer for marking client as not eligible"""

    notes = serializers.CharField(required=False, allow_blank=True)


class CreateCaseSerializer(serializers.Serializer):
    """Serializer for creating a case from client - all fields optional with defaults"""

    caseType = serializers.ChoiceField(choices=[
        ('residential', 'Residential'),
        ('commercial', 'Commercial'),
    ], required=False, default='residential')
    serviceType = serializers.ChoiceField(choices=[
        ('assisted', 'Assisted'),
        ('fullyPackaged', 'Fully Packaged'),
    ], required=False, default='assisted')
    applicationType = serializers.ChoiceField(choices=[
        ('individual', 'Individual'),
        ('joint', 'Joint'),
    ], required=False, default='individual')
    mortgageType = serializers.ChoiceField(choices=[
        ('islamic', 'Islamic'),
        ('conventional', 'Conventional'),
    ], required=False, default='conventional')
    emirate = serializers.ChoiceField(choices=[
        ('abuDhabi', 'Abu Dhabi'),
        ('ajman', 'Ajman'),
        ('dubai', 'Dubai'),
        ('fujairah', 'Fujairah'),
        ('rak', 'Ras Al Khaimah'),
        ('sharjah', 'Sharjah'),
        ('uaq', 'Umm Al Quwain'),
    ], required=False, default='dubai')
    loanAmount = serializers.DecimalField(max_digits=12, decimal_places=2, required=False, allow_null=True)
    transactionType = serializers.ChoiceField(choices=[
        ('primaryPurchase', 'Primary Purchase'),
        ('resale', 'Resale'),
        ('buyoutEquity', 'Buyout + Equity'),
        ('buyout', 'Buyout'),
        ('equity', 'Equity'),
    ], required=False, default='primaryPurchase')
    mortgageTermYears = serializers.IntegerField(min_value=1, max_value=25, required=False, default=25)
    mortgageTermMonths = serializers.IntegerField(min_value=0, max_value=11, required=False, default=0)
    estimatedPropertyValue = serializers.DecimalField(max_digits=12, decimal_places=2, required=False, allow_null=True)
    propertyStatus = serializers.ChoiceField(choices=[
        ('ready', 'Ready'),
        ('underConstruction', 'Under Construction'),
    ], required=False, default='ready')
    bankProductIds = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        max_length=3
    )

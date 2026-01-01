"""
Case Serializers
"""

from rest_framework import serializers
from core.models import Case, BankForm, BankProduct, Client, CallLog, Note, CaseStageChange
from api.serializers.common import CallLogSerializer, NoteSerializer, LogCallSerializer, AddNoteSerializer


class CaseStageChangeSerializer(serializers.ModelSerializer):
    """Serializer for CaseStageChange model"""

    fromStage = serializers.CharField(source='from_stage', read_only=True)
    toStage = serializers.CharField(source='to_stage', read_only=True)

    class Meta:
        model = CaseStageChange
        fields = ['id', 'fromStage', 'toStage', 'notes', 'timestamp']
        read_only_fields = ['id', 'timestamp']


class BankFormSerializer(serializers.ModelSerializer):
    """Serializer for BankForm model"""

    uploadedAt = serializers.DateTimeField(source='uploaded_at', read_only=True)
    fileUrl = serializers.URLField(source='file_url', read_only=True)

    class Meta:
        model = BankForm
        fields = ['id', 'type', 'status', 'fileUrl', 'uploadedAt']
        read_only_fields = ['id']


class BankProductSerializer(serializers.ModelSerializer):
    """Serializer for BankProduct model"""

    bankName = serializers.CharField(source='bank_name')
    productName = serializers.CharField(source='product_name')
    maxLtv = serializers.DecimalField(source='max_ltv', max_digits=5, decimal_places=2, required=False, allow_null=True)
    maxDbr = serializers.DecimalField(source='max_dbr', max_digits=5, decimal_places=2, required=False, allow_null=True)
    isActive = serializers.BooleanField(source='is_active')

    class Meta:
        model = BankProduct
        fields = ['id', 'bankName', 'productName', 'rate', 'maxLtv', 'maxDbr', 'isActive']


class ClientSummarySerializer(serializers.ModelSerializer):
    """Summary serializer for Client (used in Case context)"""

    firstName = serializers.CharField(source='first_name')
    lastName = serializers.CharField(source='last_name')
    sourceDisplay = serializers.ReadOnlyField(source='source_display')

    class Meta:
        model = Client
        fields = ['id', 'firstName', 'lastName', 'email', 'phone', 'sourceDisplay']


class CaseListSerializer(serializers.ModelSerializer):
    """Serializer for Case list view - minimal data for fast loading"""

    caseId = serializers.CharField(source='case_id')
    caseType = serializers.CharField(source='case_type')
    loanAmount = serializers.DecimalField(source='loan_amount', max_digits=12, decimal_places=2)
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)
    updatedAt = serializers.DateTimeField(source='updated_at', read_only=True)
    client = ClientSummarySerializer(read_only=True)
    bankFormsCount = serializers.SerializerMethodField()
    bankName = serializers.SerializerMethodField()
    bankIcon = serializers.SerializerMethodField()

    class Meta:
        model = Case
        fields = [
            'id', 'caseId', 'client', 'caseType', 'emirate',
            'loanAmount', 'stage', 'createdAt', 'updatedAt', 'bankFormsCount', 'bankName', 'bankIcon'
        ]

    def get_bankFormsCount(self, obj):
        """Uses prefetched bank_forms"""
        forms = list(obj.bank_forms.all())
        uploaded = sum(1 for f in forms if f.status in ('uploaded', 'verified'))
        total = len(forms)
        return f"{uploaded}/{total}"

    def get_bankName(self, obj):
        """Returns bank_name from case or first bank product - uses prefetched data"""
        if obj.bank_name:
            return obj.bank_name
        products = list(obj.bank_products.all())
        if products:
            return products[0].bank_name
        return None

    def get_bankIcon(self, obj):
        """Returns the bank icon - uses prefetched bank_products"""
        products = list(obj.bank_products.all())
        if products:
            return products[0].bank_icon
        # Fallback lookup by bank_name (still N+1 but rare case)
        if obj.bank_name:
            bank_product = BankProduct.objects.filter(bank_name=obj.bank_name).first()
            if bank_product:
                return bank_product.bank_icon
        return None


class CaseDetailSerializer(serializers.ModelSerializer):
    """Serializer for Case detail view - full data with activity"""

    caseId = serializers.CharField(source='case_id')
    caseType = serializers.CharField(source='case_type')
    serviceType = serializers.CharField(source='service_type')
    applicationType = serializers.CharField(source='application_type')
    mortgageType = serializers.CharField(source='mortgage_type')
    loanAmount = serializers.DecimalField(source='loan_amount', max_digits=12, decimal_places=2)
    transactionType = serializers.CharField(source='transaction_type')
    mortgageTermYears = serializers.IntegerField(source='mortgage_term_years')
    mortgageTermMonths = serializers.IntegerField(source='mortgage_term_months')
    estimatedPropertyValue = serializers.DecimalField(source='estimated_property_value', max_digits=12, decimal_places=2)
    propertyStatus = serializers.CharField(source='property_status')
    stageReason = serializers.CharField(source='stage_reason', required=False, allow_null=True, allow_blank=True)
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)
    updatedAt = serializers.DateTimeField(source='updated_at', read_only=True)
    # Bank product fields (flattened)
    bankName = serializers.CharField(source='bank_name', read_only=True)
    rateType = serializers.CharField(source='rate_type', read_only=True)
    ratePercent = serializers.DecimalField(source='rate_percent', max_digits=5, decimal_places=2, read_only=True)
    fixedPeriodYears = serializers.IntegerField(source='fixed_period_years', read_only=True)

    client = ClientSummarySerializer(read_only=True)
    bankProducts = BankProductSerializer(source='bank_products', many=True, read_only=True)
    bankForms = BankFormSerializer(source='bank_forms', many=True, read_only=True)
    callLogs = serializers.SerializerMethodField()
    notes = serializers.SerializerMethodField()
    stageChanges = serializers.SerializerMethodField()

    class Meta:
        model = Case
        fields = [
            'id', 'caseId', 'client',
            'caseType', 'serviceType', 'applicationType', 'mortgageType',
            'emirate', 'loanAmount', 'transactionType',
            'mortgageTermYears', 'mortgageTermMonths',
            'estimatedPropertyValue', 'propertyStatus',
            'bankName', 'rateType', 'ratePercent', 'fixedPeriodYears',
            'stage', 'stageReason',
            'bankProducts', 'bankForms',
            'createdAt', 'updatedAt',
            'callLogs', 'notes', 'stageChanges'
        ]

    def _get_prefetched_call_logs(self, obj):
        """Get call logs from prefetched context or fallback to query"""
        prefetched = self.context.get('prefetched_call_logs')
        if prefetched is not None:
            return prefetched.get(obj.id, [])
        return list(CallLog.objects.filter(entity_type='case', entity_id=obj.id))

    def _get_prefetched_notes(self, obj):
        """Get notes from prefetched context or fallback to query"""
        prefetched = self.context.get('prefetched_notes')
        if prefetched is not None:
            return prefetched.get(obj.id, [])
        return list(Note.objects.filter(entity_type='case', entity_id=obj.id))

    def get_callLogs(self, obj):
        call_logs = self._get_prefetched_call_logs(obj)
        return CallLogSerializer(call_logs, many=True).data

    def get_notes(self, obj):
        notes = self._get_prefetched_notes(obj)
        return NoteSerializer(notes, many=True).data

    def get_stageChanges(self, obj):
        """Uses prefetched stage_changes"""
        return CaseStageChangeSerializer(obj.stage_changes.all(), many=True).data


class CaseCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a Case"""

    clientId = serializers.PrimaryKeyRelatedField(source='client', queryset=Client.objects.all())
    caseType = serializers.CharField(source='case_type')
    serviceType = serializers.CharField(source='service_type')
    applicationType = serializers.CharField(source='application_type')
    mortgageType = serializers.CharField(source='mortgage_type')
    loanAmount = serializers.DecimalField(source='loan_amount', max_digits=12, decimal_places=2)
    transactionType = serializers.CharField(source='transaction_type')
    mortgageTermYears = serializers.IntegerField(source='mortgage_term_years')
    mortgageTermMonths = serializers.IntegerField(source='mortgage_term_months', required=False, default=0)
    estimatedPropertyValue = serializers.DecimalField(source='estimated_property_value', max_digits=12, decimal_places=2)
    propertyStatus = serializers.CharField(source='property_status')
    # Bank product fields (flattened)
    bankName = serializers.CharField(source='bank_name', required=False, allow_null=True, allow_blank=True)
    rateType = serializers.CharField(source='rate_type', required=False, allow_null=True, allow_blank=True)
    ratePercent = serializers.DecimalField(source='rate_percent', max_digits=5, decimal_places=2, required=False, allow_null=True)
    fixedPeriodYears = serializers.IntegerField(source='fixed_period_years', required=False, allow_null=True)
    bankProductIds = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        max_length=3,
        write_only=True
    )

    class Meta:
        model = Case
        fields = [
            'clientId', 'caseType', 'serviceType', 'applicationType', 'mortgageType',
            'emirate', 'loanAmount', 'transactionType',
            'mortgageTermYears', 'mortgageTermMonths',
            'estimatedPropertyValue', 'propertyStatus',
            'bankName', 'rateType', 'ratePercent', 'fixedPeriodYears',
            'bankProductIds'
        ]


class CaseUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating a Case"""

    caseType = serializers.CharField(source='case_type', required=False)
    serviceType = serializers.CharField(source='service_type', required=False)
    applicationType = serializers.CharField(source='application_type', required=False)
    mortgageType = serializers.CharField(source='mortgage_type', required=False)
    loanAmount = serializers.DecimalField(source='loan_amount', max_digits=12, decimal_places=2, required=False)
    transactionType = serializers.CharField(source='transaction_type', required=False)
    mortgageTermYears = serializers.IntegerField(source='mortgage_term_years', required=False)
    mortgageTermMonths = serializers.IntegerField(source='mortgage_term_months', required=False)
    estimatedPropertyValue = serializers.DecimalField(source='estimated_property_value', max_digits=12, decimal_places=2, required=False)
    propertyStatus = serializers.CharField(source='property_status', required=False)
    # Bank product fields (flattened)
    bankName = serializers.CharField(source='bank_name', required=False, allow_null=True, allow_blank=True)
    rateType = serializers.CharField(source='rate_type', required=False, allow_null=True, allow_blank=True)
    ratePercent = serializers.DecimalField(source='rate_percent', max_digits=5, decimal_places=2, required=False, allow_null=True)
    fixedPeriodYears = serializers.IntegerField(source='fixed_period_years', required=False, allow_null=True)

    class Meta:
        model = Case
        fields = [
            'caseType', 'serviceType', 'applicationType', 'mortgageType',
            'emirate', 'loanAmount', 'transactionType',
            'mortgageTermYears', 'mortgageTermMonths',
            'estimatedPropertyValue', 'propertyStatus',
            'bankName', 'rateType', 'ratePercent', 'fixedPeriodYears'
        ]


class AdvanceStageSerializer(serializers.Serializer):
    """Serializer for advancing case stage"""

    notes = serializers.CharField(required=False, allow_blank=True)


class DeclineSerializer(serializers.Serializer):
    """Serializer for declining a case"""

    reason = serializers.CharField(required=False, allow_blank=True, default='')


class WithdrawSerializer(serializers.Serializer):
    """Serializer for withdrawing a case"""

    reason = serializers.CharField(required=False, allow_blank=True, default='')


class SetStageSerializer(serializers.Serializer):
    """Serializer for setting case stage directly (for drag and drop)"""

    stage = serializers.ChoiceField(choices=Case.STAGE_CHOICES)
    notes = serializers.CharField(required=False, allow_blank=True, default='')

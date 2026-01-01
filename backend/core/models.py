"""
Rivo OS - Core Data Models
"""

from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone


# =============================================================================
# System Settings Model (Singleton)
# =============================================================================

class SystemSettings(models.Model):
    """System-wide settings (singleton model)"""

    system_password = models.CharField(max_length=128, blank=True, default='')
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'system_settings'
        verbose_name = 'System Settings'
        verbose_name_plural = 'System Settings'

    def save(self, *args, **kwargs):
        # Ensure only one instance exists
        self.pk = 1
        super().save(*args, **kwargs)

    @classmethod
    def get_settings(cls):
        """Get or create the singleton settings instance"""
        settings, _ = cls.objects.get_or_create(pk=1)
        return settings


# =============================================================================
# User Model
# =============================================================================

class User(AbstractUser):
    """Custom User model for Rivo OS"""

    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
    ]

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')

    class Meta:
        db_table = 'users'

    def __str__(self):
        return f"{self.first_name} {self.last_name}" if self.first_name else self.username


# =============================================================================
# Reference Data Models
# =============================================================================

class Channel(models.Model):
    """Lead/Client source channels - Fixed predefined channels"""

    CHANNEL_CHOICES = [
        ('perf_marketing', 'Performance Marketing'),
        ('partner_hub', 'Partner Hub'),
        ('freelance', 'Freelance Network'),
        ('bh_mortgage', 'BH Mortgage Team'),
        ('askrivo', 'AskRivo'),
    ]

    TRUST_LEVEL_CHOICES = [
        ('trusted', 'Trusted'),
        ('untrusted', 'Untrusted'),
    ]

    id = models.CharField(max_length=20, primary_key=True, choices=CHANNEL_CHOICES)
    name = models.CharField(max_length=50)
    trust_level = models.CharField(max_length=10, choices=TRUST_LEVEL_CHOICES, default='trusted')

    class Meta:
        db_table = 'channel'

    def __str__(self):
        return self.name


class Source(models.Model):
    """Sources under a channel - no status, just a container for sub-sources"""

    id = models.UUIDField(primary_key=True, default=None, editable=False)
    channel = models.ForeignKey(Channel, on_delete=models.CASCADE, related_name='sources', to_field='id')
    name = models.CharField(max_length=100)
    contact_phone = models.CharField(max_length=20, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'source'
        ordering = ['name']

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.id:
            import uuid
            self.id = uuid.uuid4()
        super().save(*args, **kwargs)


class SubSource(models.Model):
    """Sub-sources under a source with status based on channel trust level"""

    # For untrusted channels (perf_marketing): incubation -> Lead, live -> Client, paused -> Blocked
    # For trusted channels: active -> Client, inactive -> Blocked
    STATUS_CHOICES = [
        ('incubation', 'Incubation'),  # Untrusted: goes to Lead
        ('live', 'Live'),              # Untrusted: goes to Client
        ('paused', 'Paused'),          # Untrusted: blocked
        ('active', 'Active'),          # Trusted: goes to Client
        ('inactive', 'Inactive'),      # Trusted: blocked
    ]

    id = models.UUIDField(primary_key=True, default=None, editable=False)
    source = models.ForeignKey(Source, on_delete=models.CASCADE, related_name='sub_sources')
    name = models.CharField(max_length=100)
    contact_phone = models.CharField(max_length=20, blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    default_sla_min = models.IntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'sub_source'
        ordering = ['name']

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.id:
            import uuid
            self.id = uuid.uuid4()
        super().save(*args, **kwargs)


class Campaign(models.Model):
    """Marketing campaigns"""

    STATUS_CHOICES = [
        ('incubation', 'Incubation'),
        ('live', 'Live'),
        ('pause', 'Pause'),
    ]

    name = models.CharField(max_length=200)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='incubation')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'campaigns'
        ordering = ['-created_at']

    def __str__(self):
        return self.name


class BankProduct(models.Model):
    """Bank mortgage products with rates and limits"""

    # Mortgage type choices
    MORTGAGE_TYPE_CHOICES = [
        ('ISLAMIC', 'Islamic'),
        ('CONVENTIONAL', 'Conventional'),
    ]

    # Interest rate type choices
    INTEREST_RATE_TYPE_CHOICES = [
        ('fixed', 'Fixed'),
        ('variable', 'Variable'),
    ]

    # Follow-on rate type choices
    FOLLOW_ON_RATE_TYPE_CHOICES = [
        ('variable_addition', 'Variable Addition'),
        ('fixed', 'Fixed'),
    ]

    # Employment type choices
    EMPLOYMENT_TYPE_CHOICES = [
        ('SALARIED', 'Salaried'),
        ('SELF EMPLOYMENT', 'Self Employed'),
        ('ALL', 'All'),
    ]

    # Transaction type choices
    TRANSACTION_TYPE_CHOICES = [
        ('PRIMARY PURCHASE', 'Primary Purchase'),
        ('RESALE', 'Resale'),
        ('HANDOVER', 'Handover'),
        ('PRIMARY/RESALE/HANDOVER', 'Primary/Resale/Handover'),
        ('BUYOUT', 'Buyout'),
        ('EQUITY RELEASE', 'Equity Release'),
    ]

    # Residency status choices
    RESIDENCY_CHOICES = [
        ('UAE RESIDENT', 'UAE Resident'),
        ('UAE NATIONAL', 'UAE National'),
        ('NON RESIDENT', 'Non Resident'),
        ('ALL', 'All'),
    ]

    # EIBOR type choices
    EIBOR_TYPE_CHOICES = [
        ('EIBOR 3 MONTH', 'EIBOR 3 Month'),
        ('EIBOR 6 MONTH', 'EIBOR 6 Month'),
        ('EIBOR 1 YEAR', 'EIBOR 1 Year'),
    ]

    # Insurance payment period choices
    PAYMENT_PERIOD_CHOICES = [
        ('monthly', 'Monthly'),
        ('annually', 'Annually'),
        ('one_time', 'One Time'),
    ]

    # Basic info
    bank_name = models.CharField(max_length=200)
    bank_logo = models.URLField(max_length=500, blank=True, null=True)
    bank_icon = models.URLField(max_length=500, blank=True, null=True)

    # Rate information
    eibor_rate = models.DecimalField(max_digits=6, decimal_places=3, null=True, blank=True)
    eibor_type = models.CharField(max_length=20, choices=EIBOR_TYPE_CHOICES, default='EIBOR 3 MONTH')
    variable_rate_addition = models.DecimalField(max_digits=6, decimal_places=3, default=0)
    minimum_rate = models.DecimalField(max_digits=6, decimal_places=3, default=0)
    fixed_until = models.IntegerField(default=0, help_text='Fixed rate period in years')
    fixed_rate = models.DecimalField(max_digits=6, decimal_places=3, default=0)
    follow_on_rate = models.DecimalField(max_digits=6, decimal_places=3, null=True, blank=True)
    follow_on_rate_type = models.CharField(max_length=20, choices=FOLLOW_ON_RATE_TYPE_CHOICES, default='variable_addition')
    interest_rate = models.DecimalField(max_digits=6, decimal_places=3, null=True, blank=True)
    interest_rate_type = models.CharField(max_length=10, choices=INTEREST_RATE_TYPE_CHOICES, default='variable')

    # Product classification
    type_of_mortgage = models.CharField(max_length=20, choices=MORTGAGE_TYPE_CHOICES, default='CONVENTIONAL')
    type_of_account = models.CharField(max_length=50, blank=True, null=True)
    type_of_employment = models.CharField(max_length=30, choices=EMPLOYMENT_TYPE_CHOICES, default='SALARIED')
    type_of_transaction = models.CharField(max_length=50, choices=TRANSACTION_TYPE_CHOICES, default='PRIMARY PURCHASE')
    citizen_state = models.CharField(max_length=20, choices=RESIDENCY_CHOICES, default='UAE RESIDENT')

    # Insurance
    life_insurance = models.DecimalField(max_digits=6, decimal_places=3, default=0, help_text='Life insurance rate as percentage')
    life_insurance_payment_period = models.CharField(max_length=20, choices=PAYMENT_PERIOD_CHOICES, default='monthly')
    property_insurance = models.DecimalField(max_digits=6, decimal_places=3, default=0, help_text='Property insurance rate as percentage')
    property_insurance_payment_period = models.CharField(max_length=20, choices=PAYMENT_PERIOD_CHOICES, default='monthly')

    # Fees
    home_valuation_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    pre_approval_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    mortgage_processing_fee = models.DecimalField(max_digits=6, decimal_places=2, default=0, help_text='As percentage')
    mortgage_processing_fee_as_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    minimum_mortgage_processing_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    buyout_processing_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    # Terms and conditions
    overpayment_fee = models.CharField(max_length=200, blank=True, null=True)
    early_settlement_fee = models.CharField(max_length=200, blank=True, null=True)

    # LTV and limits
    loan_to_value_ratio = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    loan_to_value_threshold = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    maximum_length_of_mortgage = models.IntegerField(default=25, help_text='Maximum mortgage term in years')
    mortgage_contract_months = models.IntegerField(default=0)

    # Monthly payment (calculated)
    monthly_payment = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)

    # Additional features
    has_fee_financing = models.BooleanField(default=False)
    includes_agency_fees = models.BooleanField(default=False)
    includes_government_fees = models.BooleanField(default=False)
    is_exclusive = models.BooleanField(default=False)

    # Customer segments (stored as JSON)
    customer_segments = models.JSONField(default=list, blank=True)

    # Additional info
    additional_information = models.TextField(blank=True, null=True)
    description = models.TextField(blank=True, null=True)

    # Status
    is_active = models.BooleanField(default=True)
    expiry_date = models.DateField(null=True, blank=True)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'bank_products'
        ordering = ['bank_name', 'type_of_mortgage']

    def __str__(self):
        return f"{self.bank_name} - {self.type_of_mortgage}"


class EiborRate(models.Model):
    """Daily EIBOR rates"""

    TERM_CHOICES = [
        ('overnight', 'Overnight'),
        ('1_week', '1 Week'),
        ('1_month', '1 Month'),
        ('3_months', '3 Months'),
        ('6_months', '6 Months'),
        ('1_year', '1 Year'),
    ]

    term = models.CharField(max_length=20, choices=TERM_CHOICES)
    rate = models.DecimalField(max_digits=6, decimal_places=3)
    date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'eibor_rates'
        ordering = ['-date', 'term']
        unique_together = ['term', 'date']

    def __str__(self):
        return f"{self.term}: {self.rate}% ({self.date})"


# =============================================================================
# Lead Model
# =============================================================================

class Lead(models.Model):
    """Raw signal from unverified channels (untrusted sources)"""

    STATUS_CHOICES = [
        ('new', 'New'),
        ('dropped', 'Dropped'),
        ('converted', 'Converted'),
    ]

    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField(blank=True, null=True)
    phone = models.CharField(max_length=20)
    source = models.ForeignKey(SubSource, on_delete=models.SET_NULL, null=True, blank=True, related_name='leads')
    intent = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='new')
    transcript = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'leads'
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['source']),
            models.Index(fields=['-created_at']),
        ]

    def __str__(self):
        return f"{self.first_name} {self.last_name}"

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"

    @property
    def source_display(self):
        """Returns SubSource (Source) format"""
        if self.source:
            return f"{self.source.name} ({self.source.source.name})"
        return None


# =============================================================================
# Client Model
# =============================================================================

class Client(models.Model):
    """Verified prospect with confirmed intent"""

    RESIDENCY_CHOICES = [
        ('citizen', 'Citizen'),
        ('resident', 'Resident'),
    ]

    EMPLOYMENT_CHOICES = [
        ('employed', 'Employed'),
        ('selfEmployed', 'Self Employed'),
    ]

    ELIGIBILITY_CHOICES = [
        ('pending', 'Pending'),
        ('eligible', 'Eligible'),
        ('notEligible', 'Not Eligible'),
    ]

    STATUS_CHOICES = [
        ('active', 'Active'),
        ('converted', 'Converted'),
        ('notProceeding', 'Not Proceeding'),
        ('notEligible', 'Not Eligible'),
    ]

    # Identity fields
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField(blank=True, default='')
    phone = models.CharField(max_length=20)
    residency_status = models.CharField(max_length=20, choices=RESIDENCY_CHOICES, default='resident')
    date_of_birth = models.DateField(null=True, blank=True)
    nationality = models.CharField(max_length=100, blank=True, default='')
    employment_status = models.CharField(max_length=20, choices=EMPLOYMENT_CHOICES, default='employed')

    # Financial fields
    monthly_salary = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    monthly_liabilities = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    loan_amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    estimated_property_value = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)

    # Eligibility (calculated)
    eligibility_status = models.CharField(max_length=20, choices=ELIGIBILITY_CHOICES, default='pending')
    estimated_dbr = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    estimated_ltv = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    max_loan_amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    eligible_bank_products = models.ManyToManyField(BankProduct, blank=True, related_name='eligible_clients')

    # Source tracking
    source = models.ForeignKey(SubSource, on_delete=models.SET_NULL, null=True, blank=True, related_name='clients')
    source_campaign = models.ForeignKey(Campaign, on_delete=models.SET_NULL, null=True, blank=True, related_name='clients')
    converted_from_lead = models.ForeignKey(Lead, on_delete=models.SET_NULL, null=True, blank=True, related_name='converted_client')

    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    status_reason = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'clients'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['eligibility_status']),
            models.Index(fields=['source']),
            models.Index(fields=['-created_at']),
        ]

    def __str__(self):
        return f"{self.first_name} {self.last_name}"

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"

    @property
    def source_display(self):
        """Returns SubSource (Source) format"""
        if self.source:
            return f"{self.source.name} ({self.source.source.name})"
        return None

    def calculate_eligibility(self):
        """Calculate DBR, LTV, and eligibility status"""
        from decimal import Decimal

        # Calculate DBR (capped at 999.99 to fit in database field)
        if self.monthly_salary and self.monthly_salary > 0 and self.monthly_liabilities:
            dbr = (self.monthly_liabilities / self.monthly_salary) * 100
            self.estimated_dbr = min(dbr, Decimal('999.99'))
        else:
            self.estimated_dbr = None

        # Calculate LTV (capped at 999.99 to fit in database field)
        if self.loan_amount and self.estimated_property_value and self.estimated_property_value > 0:
            ltv = (self.loan_amount / self.estimated_property_value) * 100
            self.estimated_ltv = min(ltv, Decimal('999.99'))
        else:
            self.estimated_ltv = None

        # Calculate max loan amount
        if self.monthly_salary and self.monthly_salary > 0:
            max_emi = self.monthly_salary * Decimal('0.5')
            if self.monthly_liabilities:
                max_emi -= self.monthly_liabilities
            if max_emi > 0:
                self.max_loan_amount = max_emi * 240
            else:
                self.max_loan_amount = Decimal('0')

        # Determine eligibility
        dbr_ok = self.estimated_dbr is None or self.estimated_dbr <= 50
        ltv_ok = self.estimated_ltv is None or self.estimated_ltv <= 80

        if dbr_ok and ltv_ok:
            self.eligibility_status = 'eligible'
        else:
            self.eligibility_status = 'notEligible'


class Document(models.Model):
    """Client documents"""

    TYPE_CHOICES = [
        ('passport', 'Passport'),
        ('emiratesId', 'Emirates ID'),
        ('visa', 'Visa'),
        ('salaryCertificate', 'Salary Certificate'),
        ('payslips', 'Payslips'),
        ('bankStatements', 'Bank Statements'),
        ('creditCardStatement', 'Credit Card Statement'),
        ('loanStatements', 'Loan Statements'),
        ('other', 'Other Document'),
    ]

    # Default document types for placeholder creation (excludes 'other')
    DEFAULT_TYPES = [
        'passport', 'emiratesId', 'visa', 'salaryCertificate',
        'payslips', 'bankStatements', 'creditCardStatement', 'loanStatements'
    ]

    STATUS_CHOICES = [
        ('missing', 'Missing'),
        ('uploaded', 'Uploaded'),
        ('verified', 'Verified'),
        ('notApplicable', 'Not Applicable'),
    ]

    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name='documents')
    type = models.CharField(max_length=30, choices=TYPE_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='missing')
    file_url = models.URLField(blank=True, null=True)
    uploaded_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'documents'
        # No unique_together to allow multiple documents of same type (for 'other' type)

    def __str__(self):
        return f"{self.client} - {self.get_type_display()}"


# =============================================================================
# Case Model
# =============================================================================

class Case(models.Model):
    """Bank application"""

    CASE_TYPE_CHOICES = [
        ('residential', 'Residential'),
        ('commercial', 'Commercial'),
    ]

    SERVICE_TYPE_CHOICES = [
        ('assisted', 'Assisted'),
        ('fullyPackaged', 'Fully Packaged'),
    ]

    APPLICATION_TYPE_CHOICES = [
        ('individual', 'Individual'),
        ('joint', 'Joint'),
    ]

    MORTGAGE_TYPE_CHOICES = [
        ('islamic', 'Islamic'),
        ('conventional', 'Conventional'),
    ]

    PROPERTY_STATUS_CHOICES = [
        ('ready', 'Ready'),
        ('underConstruction', 'Under Construction'),
    ]

    EMIRATE_CHOICES = [
        ('abuDhabi', 'Abu Dhabi'),
        ('ajman', 'Ajman'),
        ('dubai', 'Dubai'),
        ('fujairah', 'Fujairah'),
        ('rak', 'Ras Al Khaimah'),
        ('sharjah', 'Sharjah'),
        ('uaq', 'Umm Al Quwain'),
    ]

    TRANSACTION_TYPE_CHOICES = [
        ('primaryPurchase', 'Primary Purchase'),
        ('resale', 'Resale'),
        ('buyoutEquity', 'Buyout + Equity'),
        ('buyout', 'Buyout'),
        ('equity', 'Equity'),
    ]

    STAGE_CHOICES = [
        ('processing', 'Processing'),
        ('submitted', 'Submitted'),
        ('underReview', 'Under Review'),
        ('preApproved', 'Pre-Approved'),
        ('valuation', 'Valuation'),
        ('folProcessing', 'FOL Processing'),
        ('folReceived', 'FOL Received'),
        ('folSigned', 'FOL Signed'),
        ('disbursed', 'Disbursed'),
        ('declined', 'Declined'),
        ('withdrawn', 'Withdrawn'),
    ]

    ACTIVE_STAGES = [
        'processing', 'submitted', 'underReview', 'preApproved',
        'valuation', 'folProcessing', 'folReceived', 'folSigned'
    ]

    TERMINAL_STAGES = ['disbursed', 'declined', 'withdrawn']

    case_id = models.CharField(max_length=10, unique=True)
    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name='cases')

    # Deal fields
    case_type = models.CharField(max_length=20, choices=CASE_TYPE_CHOICES)
    service_type = models.CharField(max_length=20, choices=SERVICE_TYPE_CHOICES)
    application_type = models.CharField(max_length=20, choices=APPLICATION_TYPE_CHOICES)
    bank_products = models.ManyToManyField(BankProduct, related_name='cases')
    mortgage_type = models.CharField(max_length=20, choices=MORTGAGE_TYPE_CHOICES)
    emirate = models.CharField(max_length=20, choices=EMIRATE_CHOICES)
    loan_amount = models.DecimalField(max_digits=12, decimal_places=2)
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPE_CHOICES)
    mortgage_term_years = models.PositiveIntegerField()
    mortgage_term_months = models.PositiveIntegerField(default=0)
    estimated_property_value = models.DecimalField(max_digits=12, decimal_places=2)
    property_status = models.CharField(max_length=20, choices=PROPERTY_STATUS_CHOICES)

    # Selected bank product fields (flattened for direct storage)
    bank_name = models.CharField(max_length=100, blank=True, null=True)
    rate_type = models.CharField(max_length=20, blank=True, null=True)  # 'fixed' or 'variable'
    rate_percent = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True)
    fixed_period_years = models.PositiveIntegerField(blank=True, null=True)

    # Stage tracking
    stage = models.CharField(max_length=20, choices=STAGE_CHOICES, default='processing')
    stage_reason = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'cases'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['stage']),
            models.Index(fields=['-created_at']),
        ]

    def __str__(self):
        return f"{self.case_id} - {self.client}"

    @classmethod
    def generate_case_id(cls):
        """Generate next case ID in RV-XXXXX format"""
        last_case = cls.objects.order_by('-id').first()
        next_num = (last_case.id + 1) if last_case else 1
        return f'RV-{next_num:05d}'

    def get_next_stage(self):
        """Get the next stage in the pipeline"""
        if self.stage in self.TERMINAL_STAGES:
            return None
        try:
            current_index = self.ACTIVE_STAGES.index(self.stage)
            if current_index == len(self.ACTIVE_STAGES) - 1:
                return 'disbursed'
            return self.ACTIVE_STAGES[current_index + 1]
        except ValueError:
            return None

    def is_terminal(self):
        """Check if case is in a terminal state"""
        return self.stage in self.TERMINAL_STAGES


class BankForm(models.Model):
    """Bank application forms"""

    TYPE_CHOICES = [
        ('accountOpeningForm', 'Account Opening Form'),
        ('fts', 'FTS'),
        ('kfs', 'KFS'),
        ('undertakings', 'Undertakings'),
        ('bankChecklist', 'Bank Checklist'),
        ('other', 'Other Document'),
    ]

    # Default form types for placeholder creation (excludes 'other')
    DEFAULT_TYPES = [
        'accountOpeningForm', 'fts', 'kfs', 'undertakings', 'bankChecklist'
    ]

    STATUS_CHOICES = [
        ('missing', 'Missing'),
        ('uploaded', 'Uploaded'),
        ('verified', 'Verified'),
    ]

    case = models.ForeignKey(Case, on_delete=models.CASCADE, related_name='bank_forms')
    type = models.CharField(max_length=30, choices=TYPE_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='missing')
    file_url = models.URLField(blank=True, null=True)
    uploaded_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'bank_forms'
        # No unique_together to allow multiple documents of same type (for 'other' type)

    def __str__(self):
        return f"{self.case.case_id} - {self.get_type_display()}"


# =============================================================================
# Activity Tracking Models
# =============================================================================

class CallLog(models.Model):
    """Phone call records"""

    OUTCOME_CHOICES = [
        ('connected', 'Connected'),
        ('noAnswer', 'No Answer'),
        ('busy', 'Busy'),
        ('wrongNumber', 'Wrong Number'),
        ('switchedOff', 'Switched Off'),
    ]

    ENTITY_TYPE_CHOICES = [
        ('lead', 'Lead'),
        ('client', 'Client'),
        ('case', 'Case'),
    ]

    entity_type = models.CharField(max_length=20, choices=ENTITY_TYPE_CHOICES)
    entity_id = models.PositiveIntegerField()
    outcome = models.CharField(max_length=20, choices=OUTCOME_CHOICES)
    notes = models.TextField(blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'call_logs'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['entity_type', 'entity_id']),
        ]

    def __str__(self):
        return f"{self.entity_type}:{self.entity_id} - {self.outcome}"


class Note(models.Model):
    """User notes on entities"""

    ENTITY_TYPE_CHOICES = [
        ('lead', 'Lead'),
        ('client', 'Client'),
        ('case', 'Case'),
    ]

    entity_type = models.CharField(max_length=20, choices=ENTITY_TYPE_CHOICES)
    entity_id = models.PositiveIntegerField()
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'notes'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['entity_type', 'entity_id']),
        ]

    def __str__(self):
        return f"{self.entity_type}:{self.entity_id} - {self.content[:50]}"


# =============================================================================
# Status Change Tracking Models
# =============================================================================

class LeadStatusChange(models.Model):
    """Lead status change history"""

    TYPE_CHOICES = [
        ('converted_to_client', 'Converted to Client'),
        ('dropped', 'Dropped'),
    ]

    lead = models.ForeignKey(Lead, on_delete=models.CASCADE, related_name='status_changes')
    type = models.CharField(max_length=30, choices=TYPE_CHOICES)
    notes = models.TextField(blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'lead_status_changes'
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.lead} - {self.type}"


class ClientStatusChange(models.Model):
    """Client status change history"""

    TYPE_CHOICES = [
        ('converted_from_lead', 'Converted from Lead'),
        ('converted_to_case', 'Converted to Case'),
        ('not_eligible', 'Not Eligible'),
        ('not_proceeding', 'Not Proceeding'),
    ]

    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name='status_changes')
    type = models.CharField(max_length=30, choices=TYPE_CHOICES)
    notes = models.TextField(blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'client_status_changes'
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.client} - {self.type}"


class CaseStageChange(models.Model):
    """Case stage change history"""

    case = models.ForeignKey(Case, on_delete=models.CASCADE, related_name='stage_changes')
    from_stage = models.CharField(max_length=20, null=True, blank=True)
    to_stage = models.CharField(max_length=20)
    notes = models.TextField(blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'case_stage_changes'
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.case.case_id}: {self.from_stage} -> {self.to_stage}"


# =============================================================================
# WhatsApp Message Model
# =============================================================================

class WhatsAppMessage(models.Model):
    """WhatsApp messages for leads and clients"""

    DIRECTION_CHOICES = [
        ('inbound', 'Inbound'),
        ('outbound', 'Outbound'),
    ]

    STATUS_CHOICES = [
        ('sent', 'Sent'),
        ('delivered', 'Delivered'),
        ('read', 'Read'),
        ('failed', 'Failed'),
    ]

    direction = models.CharField(max_length=10, choices=DIRECTION_CHOICES)
    phone = models.CharField(max_length=20)
    content = models.TextField()
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='sent')
    lead = models.ForeignKey(Lead, null=True, blank=True, on_delete=models.SET_NULL, related_name='whatsapp_messages')
    client = models.ForeignKey(Client, null=True, blank=True, on_delete=models.SET_NULL, related_name='whatsapp_messages')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'whatsapp_messages'
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['lead']),
            models.Index(fields=['client']),
            models.Index(fields=['phone']),
        ]

    def __str__(self):
        return f"{self.direction}: {self.content[:50]}"

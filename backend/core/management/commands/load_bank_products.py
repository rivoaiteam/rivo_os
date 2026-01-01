"""
Management command to load sample bank products and EIBOR rates.
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import date
from core.models import BankProduct, EiborRate


class Command(BaseCommand):
    help = 'Load sample bank products and EIBOR rates'

    def handle(self, *args, **options):
        self.stdout.write('Loading sample data...')

        # Load EIBOR rates first
        self.load_eibor_rates()

        # Load bank products
        self.load_bank_products()

        self.stdout.write(self.style.SUCCESS('Sample data loaded successfully!'))

    def load_eibor_rates(self):
        """Load sample EIBOR rates"""
        today = date.today()

        rates = [
            {'term': 'overnight', 'rate': 4.856},
            {'term': '1_week', 'rate': 4.872},
            {'term': '1_month', 'rate': 4.893},
            {'term': '3_months', 'rate': 3.625},
            {'term': '6_months', 'rate': 4.654},
            {'term': '1_year', 'rate': 4.513},
        ]

        for rate_data in rates:
            EiborRate.objects.update_or_create(
                term=rate_data['term'],
                date=today,
                defaults={'rate': rate_data['rate']}
            )

        self.stdout.write(f'  Loaded {len(rates)} EIBOR rates')

    def load_bank_products(self):
        """Load sample bank products based on user's sample data"""

        # Base product template from the user's sample data
        base_product = {
            'eibor_rate': 3.625,
            'eibor_type': 'EIBOR 3 MONTH',
            'variable_rate_addition': 0.0,
            'minimum_rate': 0.0,
            'fixed_until': 0,
            'fixed_rate': 0.0,
            'follow_on_rate': 3.625,
            'follow_on_rate_type': 'variable_addition',
            'interest_rate': 3.625,
            'interest_rate_type': 'variable',
            'type_of_account': 'NSTL',
            'life_insurance': 0.165,
            'life_insurance_payment_period': 'monthly',
            'property_insurance': 0.06,
            'property_insurance_payment_period': 'monthly',
            'home_valuation_fee': 2625.0,
            'overpayment_fee': 'Up to 25% every year',
            'additional_information': 'Test Product – SF Integration',
            'buyout_processing_fee': 0.0,
            'maximum_length_of_mortgage': 25,
            'type_of_employment': 'SELF EMPLOYMENT',
            'type_of_transaction': 'PRIMARY PURCHASE',
            'citizen_state': 'UAE RESIDENT',
            'expiry_date': None,
            'pre_approval_fee': 1050.0,
            'early_settlement_fee': '1% of the loan outstanding or AED 10,000 whichever is lower',
            'loan_to_value_ratio': 0.0,
            'loan_to_value_threshold': None,
            'minimum_mortgage_processing_fee': 0.0,
            'mortgage_processing_fee': 0.52,
            'mortgage_contract_months': 0,
            'monthly_payment': None,
            'mortgage_processing_fee_as_amount': None,
            'is_exclusive': False,
            'description': None,
            'customer_segments': [
                {'type_of_account': 'Test Product', 'profile': 'Salesforce Integration', 'description': None}
            ],
            'has_fee_financing': False,
            'includes_agency_fees': False,
            'includes_government_fees': False,
            'is_active': True,
        }

        products = [
            {
                **base_product,
                'bank_name': 'EIB - Business Banking',
                'bank_logo': 'https://huspy-production-public.s3.amazonaws.com/static/application/bank_entity/Emirates%20Islamic%20Bank%20Business%20Banking/emirates_islamic_ok.png',
                'bank_icon': 'https://huspy-production-public.s3.amazonaws.com/static/application/bank_entity/Emirates%20Islamic%20Bank%20Business%20Banking/emirates_islamic.png',
                'type_of_mortgage': 'ISLAMIC',
            },
            {
                **base_product,
                'bank_name': 'DIB - Business Banking',
                'bank_logo': 'https://huspy-production-public.s3.amazonaws.com/static/application/bank_entity/DIB%20Business%20Banking/dubai_islamic_bank_ok.png',
                'bank_icon': 'https://huspy-production-public.s3.amazonaws.com/static/application/bank_entity/DIB%20Business%20Banking/dubai_islamic_bank.png',
                'type_of_mortgage': 'ISLAMIC',
            },
            {
                **base_product,
                'bank_name': 'RAK - Business Banking',
                'bank_logo': 'https://huspy-production-public.s3.amazonaws.com/static/application/bank_entity/RAK%20-%20Business%20Banking/RAK_Logo.png',
                'bank_icon': 'https://huspy-production-public.s3.amazonaws.com/static/application/bank_entity/RAK%20Business%20Banking/rakbank_1.png',
                'type_of_mortgage': 'CONVENTIONAL',
            },
            {
                **base_product,
                'bank_name': 'FAB - Business Banking',
                'bank_logo': 'https://huspy-production-public.s3.amazonaws.com/static/application/bank_entity/FAB%20Business%20Banking/images.png',
                'bank_icon': 'https://huspy-production-public.s3.amazonaws.com/static/application/bank_entity/FAB%20Business%20Banking/images.png',
                'type_of_mortgage': 'CONVENTIONAL',
            },
            {
                **base_product,
                'bank_name': 'Mashreq - Business Banking',
                'bank_logo': 'https://huspy-production-public.s3.amazonaws.com/static/application/bank_entity/Mashreq%20Business%20Banking/mashrek_ok.png',
                'bank_icon': 'https://huspy-production-public.s3.amazonaws.com/static/application/bank_entity/Mashreq%20Business%20Banking/mashrek.png',
                'type_of_mortgage': 'CONVENTIONAL',
            },
            {
                **base_product,
                'bank_name': 'Invest Bank - Business Banking',
                'bank_logo': 'https://huspy-production-public.s3.amazonaws.com/static/application/bank_entity/Invest%20Bank%20-%20Business%20Banking/image_1.png',
                'bank_icon': 'https://huspy-production-public.s3.amazonaws.com/static/application/bank_entity/Invest%20Bank%20-%20Business%20Banking/download_1.jpeg',
                'type_of_mortgage': 'CONVENTIONAL',
            },
            {
                **base_product,
                'bank_name': 'MBank - Business Banking',
                'bank_logo': 'https://huspy-production-public.s3.amazonaws.com/static/application/bank_entity/MBank%20-%20Business%20Banking/image.png',
                'bank_icon': 'https://huspy-production-public.s3.amazonaws.com/static/application/bank_entity/MBank%20-%20Business%20Banking/download.jpeg',
                'type_of_mortgage': 'CONVENTIONAL',
            },
            {
                **base_product,
                'bank_name': 'Ajman Bank - Business Banking',
                'bank_logo': 'https://huspy-production-public.s3.amazonaws.com/static/application/bank_entity/Ajman%20Bank/ajman-bank-logo.png',
                'bank_icon': 'https://huspy-production-public.s3.amazonaws.com/static/application/bank_entity/Ajman%20Bank/Ajmanajman.png',
                'type_of_mortgage': 'ISLAMIC',
            },
            {
                **base_product,
                'bank_name': 'SIB - Business Banking',
                'bank_logo': 'https://huspy-production-public.s3.amazonaws.com/static/application/bank_entity/Sharjah%20Islamic%20Bank/sharjah_islamic_bank_ok.png',
                'bank_icon': 'https://huspy-production-public.s3.amazonaws.com/static/application/bank_entity/Sharjah%20Islamic%20Bank/sharjah_islamic_bank.png',
                'type_of_mortgage': 'ISLAMIC',
            },
        ]

        created_count = 0
        for product_data in products:
            # Check if product with same bank_name exists
            existing = BankProduct.objects.filter(
                bank_name=product_data['bank_name'],
            ).first()

            if existing:
                # Update existing
                for key, value in product_data.items():
                    setattr(existing, key, value)
                existing.save()
            else:
                # Create new
                BankProduct.objects.create(**product_data)
                created_count += 1

        self.stdout.write(f'  Loaded {len(products)} bank products ({created_count} new)')

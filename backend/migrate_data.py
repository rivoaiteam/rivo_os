"""
Script to migrate data from SQLite to Supabase PostgreSQL
"""
import os
import sys
import django
import sqlite3

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'rivo.settings')
django.setup()

from core.models import (
    Channel, Source, SubSource, Campaign, User,
    Lead, Client, Case, Document, BankForm,
    CallLog, Note, LeadStatusChange, ClientStatusChange, CaseStageChange,
    BankProduct, EiborRate, SystemSettings
)
from django.db import connection

def migrate_channels():
    conn = sqlite3.connect('db.sqlite3')
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM channel")
    rows = cursor.fetchall()

    for row in rows:
        Channel.objects.update_or_create(
            id=row['id'],
            defaults={
                'name': row['name'],
                'trust_level': row['trust_level'] if 'trust_level' in row.keys() else 'trusted',
            }
        )
    print(f"Migrated {len(rows)} channels")
    conn.close()

def migrate_sources():
    conn = sqlite3.connect('db.sqlite3')
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM source")
    rows = cursor.fetchall()

    for row in rows:
        Source.objects.update_or_create(
            id=row['id'],
            defaults={
                'name': row['name'],
                'channel_id': row['channel_id'],
                'contact_phone': row['contact_phone'] if 'contact_phone' in row.keys() else None,
            }
        )
    print(f"Migrated {len(rows)} sources")
    conn.close()

def migrate_subsources():
    conn = sqlite3.connect('db.sqlite3')
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM sub_source")
    rows = cursor.fetchall()

    for row in rows:
        SubSource.objects.update_or_create(
            id=row['id'],
            defaults={
                'name': row['name'],
                'source_id': row['source_id'],
                'status': row['status'] if 'status' in row.keys() else 'active',
                'default_sla_min': row['default_sla_min'] if 'default_sla_min' in row.keys() else 60,
                'contact_phone': row['contact_phone'] if 'contact_phone' in row.keys() else None,
            }
        )
    print(f"Migrated {len(rows)} subsources")
    conn.close()

def migrate_campaigns():
    conn = sqlite3.connect('db.sqlite3')
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM campaigns")
    rows = cursor.fetchall()

    for row in rows:
        defaults = {'name': row['name']}
        if 'status' in row.keys():
            defaults['status'] = row['status']
        Campaign.objects.update_or_create(
            id=row['id'],
            defaults=defaults
        )
    print(f"Migrated {len(rows)} campaigns")
    conn.close()

def migrate_users():
    conn = sqlite3.connect('db.sqlite3')
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM users")
    rows = cursor.fetchall()

    for row in rows:
        User.objects.update_or_create(
            id=row['id'],
            defaults={
                'username': row['username'],
                'email': row['email'] or '',
                'first_name': row['first_name'] or '',
                'last_name': row['last_name'] or '',
                'is_active': bool(row['is_active']),
                'password': row['password'],
                'is_staff': bool(row['is_staff']),
                'is_superuser': bool(row['is_superuser']),
                'status': row['status'] if 'status' in row.keys() else 'active',
            }
        )
    print(f"Migrated {len(rows)} users")
    conn.close()

def migrate_bank_products():
    conn = sqlite3.connect('db.sqlite3')
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM bank_products")
    rows = cursor.fetchall()
    col_names = [desc[0] for desc in cursor.description]

    for row in rows:
        row_dict = dict(row)
        defaults = {
            'bank_name': row_dict.get('bank_name', ''),
            'bank_logo': row_dict.get('bank_logo') or '',
            'bank_icon': row_dict.get('bank_icon') or '',
            'type_of_mortgage': row_dict.get('type_of_mortgage') or 'CONVENTIONAL',
            'type_of_employment': row_dict.get('type_of_employment') or 'ALL',
            'type_of_transaction': row_dict.get('type_of_transaction') or 'PRIMARY PURCHASE',
            'citizen_state': row_dict.get('citizen_state') or 'ALL',
            'interest_rate': float(row_dict.get('interest_rate') or 0),
            'interest_rate_type': row_dict.get('interest_rate_type') or 'variable',
            'eibor_type': row_dict.get('eibor_type') or 'EIBOR 3 MONTH',
            'mortgage_processing_fee': float(row_dict.get('mortgage_processing_fee') or 0),
            'follow_on_rate': float(row_dict.get('follow_on_rate') or 0) if row_dict.get('follow_on_rate') else None,
            'is_active': bool(row_dict.get('is_active')),
            'is_exclusive': bool(row_dict.get('is_exclusive')) if row_dict.get('is_exclusive') is not None else False,
            'loan_to_value_ratio': float(row_dict.get('loan_to_value_ratio') or 0),
            'customer_segments': row_dict.get('customer_segments') or [],
        }

        # Add optional fields if they exist
        optional_fields = [
            'eibor_rate', 'variable_rate_addition', 'minimum_rate', 'fixed_until', 'fixed_rate',
            'follow_on_rate_type', 'type_of_account', 'life_insurance', 'life_insurance_payment_period',
            'property_insurance', 'property_insurance_payment_period', 'home_valuation_fee',
            'pre_approval_fee', 'mortgage_processing_fee_as_amount', 'minimum_mortgage_processing_fee',
            'buyout_processing_fee', 'overpayment_fee', 'early_settlement_fee', 'loan_to_value_threshold',
            'maximum_length_of_mortgage', 'mortgage_contract_months', 'monthly_payment',
            'has_fee_financing', 'includes_agency_fees', 'includes_government_fees',
            'additional_information', 'description', 'expiry_date'
        ]

        for field in optional_fields:
            if field in row_dict and row_dict[field] is not None:
                defaults[field] = row_dict[field]

        BankProduct.objects.update_or_create(
            id=row_dict['id'],
            defaults=defaults
        )
    print(f"Migrated {len(rows)} bank products")
    conn.close()

def migrate_eibor_rates():
    conn = sqlite3.connect('db.sqlite3')
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM eibor_rates")
    rows = cursor.fetchall()

    for row in rows:
        EiborRate.objects.update_or_create(
            id=row['id'],
            defaults={
                'term': row['term'],
                'rate': float(row['rate']),
                'date': row['date'],
            }
        )
    print(f"Migrated {len(rows)} eibor rates")
    conn.close()

def migrate_system_settings():
    conn = sqlite3.connect('db.sqlite3')
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM system_settings")
    rows = cursor.fetchall()

    for row in rows:
        row_dict = dict(row)
        defaults = {}
        if 'system_password' in row_dict:
            defaults['system_password'] = row_dict.get('system_password') or ''
        SystemSettings.objects.update_or_create(
            id=row_dict.get('id', 1),
            defaults=defaults
        )
    print(f"Migrated {len(rows)} system settings")
    conn.close()

def migrate_leads():
    conn = sqlite3.connect('db.sqlite3')
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM leads")
    rows = cursor.fetchall()

    for row in rows:
        row_dict = dict(row)
        Lead.objects.update_or_create(
            id=row_dict['id'],
            defaults={
                'first_name': row_dict.get('first_name', ''),
                'last_name': row_dict.get('last_name') or '',
                'email': row_dict.get('email') or '',
                'phone': row_dict.get('phone', ''),
                'channel': row_dict.get('channel') or 'Meta',
                'campaign_id': row_dict.get('campaign_id') if row_dict.get('campaign_id') else None,
                'intent': row_dict.get('intent') or '',
                'status': row_dict.get('status') or 'new',
            }
        )
    print(f"Migrated {len(rows)} leads")
    conn.close()

def migrate_clients():
    conn = sqlite3.connect('db.sqlite3')
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM clients")
    rows = cursor.fetchall()

    for row in rows:
        row_dict = dict(row)
        Client.objects.update_or_create(
            id=row_dict['id'],
            defaults={
                'first_name': row_dict.get('first_name', ''),
                'last_name': row_dict.get('last_name') or '',
                'email': row_dict.get('email') or '',
                'phone': row_dict.get('phone', ''),
                'date_of_birth': row_dict.get('date_of_birth') if row_dict.get('date_of_birth') else None,
                'nationality': row_dict.get('nationality') or '',
                'residency_status': row_dict.get('residency_status') or 'resident',
                'employment_status': row_dict.get('employment_status') or 'employed',
                'monthly_salary': float(row_dict.get('monthly_salary') or 0),
                'monthly_liabilities': float(row_dict.get('monthly_liabilities')) if row_dict.get('monthly_liabilities') else None,
                'loan_amount': float(row_dict.get('loan_amount')) if row_dict.get('loan_amount') else None,
                'estimated_property_value': float(row_dict.get('estimated_property_value')) if row_dict.get('estimated_property_value') else None,
                'source_channel': row_dict.get('source_channel') or 'Meta',
                'source_campaign_id': row_dict.get('source_campaign_id') if row_dict.get('source_campaign_id') else None,
                'converted_from_lead_id': row_dict.get('converted_from_lead_id') if row_dict.get('converted_from_lead_id') else None,
                'status': row_dict.get('status') or 'active',
                'status_reason': row_dict.get('status_reason') or '',
                'eligibility_status': row_dict.get('eligibility_status') or 'pending',
                'estimated_dbr': float(row_dict.get('estimated_dbr')) if row_dict.get('estimated_dbr') else None,
                'estimated_ltv': float(row_dict.get('estimated_ltv')) if row_dict.get('estimated_ltv') else None,
                'max_loan_amount': float(row_dict.get('max_loan_amount')) if row_dict.get('max_loan_amount') else None,
            }
        )
    print(f"Migrated {len(rows)} clients")
    conn.close()

def migrate_cases():
    conn = sqlite3.connect('db.sqlite3')
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM cases")
    rows = cursor.fetchall()

    for row in rows:
        row_dict = dict(row)
        Case.objects.update_or_create(
            id=row_dict['id'],
            defaults={
                'case_id': row_dict.get('case_id', ''),
                'client_id': row_dict.get('client_id'),
                'case_type': row_dict.get('case_type') or 'residential',
                'service_type': row_dict.get('service_type') or 'assisted',
                'application_type': row_dict.get('application_type') or 'individual',
                'mortgage_type': row_dict.get('mortgage_type') or 'conventional',
                'emirate': row_dict.get('emirate') or 'dubai',
                'loan_amount': float(row_dict.get('loan_amount') or 0),
                'transaction_type': row_dict.get('transaction_type') or 'primaryPurchase',
                'mortgage_term_years': row_dict.get('mortgage_term_years') or 0,
                'mortgage_term_months': row_dict.get('mortgage_term_months') or 0,
                'estimated_property_value': float(row_dict.get('estimated_property_value') or 0),
                'property_status': row_dict.get('property_status') or 'ready',
                'stage': row_dict.get('stage') or 'processing',
                'stage_reason': row_dict.get('stage_reason') or '',
            }
        )
    print(f"Migrated {len(rows)} cases")
    conn.close()

def migrate_documents():
    conn = sqlite3.connect('db.sqlite3')
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM documents")
    rows = cursor.fetchall()

    for row in rows:
        row_dict = dict(row)
        Document.objects.update_or_create(
            id=row_dict['id'],
            defaults={
                'client_id': row_dict.get('client_id'),
                'type': row_dict.get('type'),
                'status': row_dict.get('status') or 'missing',
                'file_url': row_dict.get('file_url') or '',
                'uploaded_at': row_dict.get('uploaded_at') if row_dict.get('uploaded_at') else None,
            }
        )
    print(f"Migrated {len(rows)} documents")
    conn.close()

def migrate_bank_forms():
    conn = sqlite3.connect('db.sqlite3')
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM bank_forms")
    rows = cursor.fetchall()

    for row in rows:
        row_dict = dict(row)
        BankForm.objects.update_or_create(
            id=row_dict['id'],
            defaults={
                'case_id': row_dict.get('case_id'),
                'type': row_dict.get('type'),
                'status': row_dict.get('status') or 'missing',
                'file_url': row_dict.get('file_url') or '',
                'uploaded_at': row_dict.get('uploaded_at') if row_dict.get('uploaded_at') else None,
            }
        )
    print(f"Migrated {len(rows)} bank forms")
    conn.close()

def migrate_call_logs():
    conn = sqlite3.connect('db.sqlite3')
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM call_logs")
    rows = cursor.fetchall()

    for row in rows:
        row_dict = dict(row)
        CallLog.objects.update_or_create(
            id=row_dict['id'],
            defaults={
                'entity_type': row_dict.get('entity_type'),
                'entity_id': row_dict.get('entity_id'),
                'outcome': row_dict.get('outcome'),
                'notes': row_dict.get('notes') or '',
            }
        )
    print(f"Migrated {len(rows)} call logs")
    conn.close()

def migrate_notes():
    conn = sqlite3.connect('db.sqlite3')
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM notes")
    rows = cursor.fetchall()

    for row in rows:
        row_dict = dict(row)
        Note.objects.update_or_create(
            id=row_dict['id'],
            defaults={
                'entity_type': row_dict.get('entity_type'),
                'entity_id': row_dict.get('entity_id'),
                'content': row_dict.get('content'),
            }
        )
    print(f"Migrated {len(rows)} notes")
    conn.close()

def migrate_case_stage_changes():
    conn = sqlite3.connect('db.sqlite3')
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM case_stage_changes")
    rows = cursor.fetchall()

    for row in rows:
        row_dict = dict(row)
        CaseStageChange.objects.update_or_create(
            id=row_dict['id'],
            defaults={
                'case_id': row_dict.get('case_id'),
                'from_stage': row_dict.get('from_stage') or '',
                'to_stage': row_dict.get('to_stage'),
                'notes': row_dict.get('notes') or '',
            }
        )
    print(f"Migrated {len(rows)} case stage changes")
    conn.close()

def reset_sequences():
    """Reset PostgreSQL sequences to match the max IDs"""
    with connection.cursor() as cursor:
        # For tables with integer primary keys
        int_tables = [
            ('campaigns', 'id'),
            ('users', 'id'),
            ('bank_products', 'id'),
            ('eibor_rates', 'id'),
            ('system_settings', 'id'),
            ('leads', 'id'),
            ('clients', 'id'),
            ('cases', 'id'),
            ('documents', 'id'),
            ('bank_forms', 'id'),
            ('call_logs', 'id'),
            ('notes', 'id'),
            ('case_stage_changes', 'id'),
        ]
        for table, pk in int_tables:
            try:
                cursor.execute(f"SELECT setval(pg_get_serial_sequence('{table}', '{pk}'), COALESCE((SELECT MAX({pk}) FROM {table}), 1))")
                print(f"Reset sequence for {table}")
            except Exception as e:
                print(f"Could not reset sequence for {table}: {e}")

def main():
    print("Starting data migration from SQLite to Supabase...")

    # Order matters due to foreign key constraints
    migrate_channels()
    migrate_sources()
    migrate_subsources()
    migrate_campaigns()
    migrate_users()
    migrate_bank_products()
    migrate_eibor_rates()
    migrate_system_settings()
    migrate_leads()
    migrate_clients()
    migrate_cases()
    migrate_documents()
    migrate_bank_forms()
    migrate_call_logs()
    migrate_notes()
    migrate_case_stage_changes()

    # Reset sequences for PostgreSQL
    reset_sequences()

    print("\nMigration complete!")

if __name__ == '__main__':
    main()

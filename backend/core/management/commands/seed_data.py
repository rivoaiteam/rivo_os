"""
Seed sample data for development
"""

from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from core.models import Campaign, Lead, CallLog


class Command(BaseCommand):
    help = 'Seed sample data for development'

    def handle(self, *args, **options):
        # Create campaigns
        campaigns_data = [
            {'name': 'Dec_Refinance_v2', 'status': 'live'},
            {'name': 'Q1_HomeLoans_2024', 'status': 'live'},
            {'name': 'NewYear_Broadcast', 'status': 'live'},
            {'name': 'RateAlert_Jan', 'status': 'incubation'},
        ]

        campaigns = {}
        for data in campaigns_data:
            campaign, created = Campaign.objects.get_or_create(
                name=data['name'],
                defaults={'status': data['status']}
            )
            campaigns[data['name']] = campaign
            if created:
                self.stdout.write(f'Created campaign: {campaign.name}')

        # Create leads
        leads_data = [
            {
                'first_name': 'Ahmed',
                'last_name': 'Al Mansouri',
                'email': 'ahmed.mansouri@email.com',
                'phone': '+971 50 123 4567',
                'channel': 'Meta',
                'campaign': 'Dec_Refinance_v2',
                'intent': "Clicked 'Free Mortgage Calculator'",
                'status': 'new',
                'hours_ago': 2,
            },
            {
                'first_name': 'Fatima',
                'last_name': 'Hassan',
                'email': 'fatima.h@gmail.com',
                'phone': '+971 55 987 6543',
                'channel': 'Google',
                'campaign': 'Q1_HomeLoans_2024',
                'intent': "Searched 'best mortgage rates dubai'",
                'status': 'new',
                'hours_ago': 4,
            },
            {
                'first_name': 'Mohammed',
                'last_name': 'Rashid',
                'email': None,
                'phone': '+971 52 555 1234',
                'channel': 'AskRivo',
                'campaign': None,
                'intent': 'Completed eligibility check via chatbot',
                'status': 'new',
                'hours_ago': 6,
                'transcript': "User: Hi, I want to check if I'm eligible for a mortgage\nRivo: Sure! What's your monthly salary?\nUser: 35,000 AED\nRivo: Great! Are you currently employed?\nUser: Yes, at Emirates Airlines for 3 years\nRivo: Based on your details, you likely qualify for up to 2.5M AED. Would you like our team to call you?\nUser: Yes please",
            },
            {
                'first_name': 'Sara',
                'last_name': 'Ahmed',
                'email': 'sara.ahmed@outlook.com',
                'phone': '+971 50 777 8888',
                'channel': 'WhatsApp',
                'campaign': 'NewYear_Broadcast',
                'intent': "Replied 'INTERESTED' to broadcast",
                'status': 'new',
                'hours_ago': 18,
            },
            {
                'first_name': 'Khalid',
                'last_name': 'Ibrahim',
                'email': None,
                'phone': '+971 56 333 2222',
                'channel': 'Meta',
                'campaign': 'Dec_Refinance_v2',
                'intent': "Clicked 'Check Your Eligibility'",
                'status': 'dropped',
                'hours_ago': 24,
            },
            {
                'first_name': 'Aisha',
                'last_name': 'Khan',
                'email': 'aisha.khan@enbd.com',
                'phone': '+971 54 111 9999',
                'channel': 'Email',
                'campaign': 'RateAlert_Jan',
                'intent': "Clicked 'See New Rates' in email",
                'status': 'new',
                'hours_ago': 20,
            },
            {
                'first_name': 'Omar',
                'last_name': 'Youssef',
                'email': 'omar.y@gmail.com',
                'phone': '+971 50 444 5555',
                'channel': 'Google',
                'campaign': 'Q1_HomeLoans_2024',
                'intent': "Searched 'mortgage calculator uae'",
                'status': 'dropped',
                'hours_ago': 30,
            },
            {
                'first_name': 'Priya',
                'last_name': 'Sharma',
                'email': 'priya.sharma@adnoc.ae',
                'phone': '+971 55 666 7777',
                'channel': 'AskRivo',
                'campaign': None,
                'intent': 'Asked about investment property financing',
                'status': 'converted',
                'hours_ago': 48,
            },
        ]

        for data in leads_data:
            # Check if lead already exists
            existing = Lead.objects.filter(phone=data['phone']).first()
            if existing:
                self.stdout.write(f'Lead already exists: {data["first_name"]} {data["last_name"]}')
                continue

            created_at = timezone.now() - timedelta(hours=data['hours_ago'])
            campaign = campaigns.get(data['campaign']) if data['campaign'] else None

            lead = Lead.objects.create(
                first_name=data['first_name'],
                last_name=data['last_name'],
                email=data.get('email'),
                phone=data['phone'],
                channel=data['channel'],
                campaign=campaign,
                intent=data['intent'],
                status=data['status'],
                transcript=data.get('transcript'),
            )
            # Manually set created_at
            Lead.objects.filter(id=lead.id).update(created_at=created_at)

            self.stdout.write(f'Created lead: {lead.first_name} {lead.last_name}')

            # Add some call logs for certain leads
            if data['first_name'] == 'Fatima':
                CallLog.objects.create(
                    entity_type='lead',
                    entity_id=lead.id,
                    outcome='noAnswer',
                    notes='Rang 6 times, no pickup'
                )
                CallLog.objects.create(
                    entity_type='lead',
                    entity_id=lead.id,
                    outcome='connected',
                    notes='Spoke briefly. Interested in refinancing current villa. Salary 45k. Will send docs.'
                )

            if data['first_name'] == 'Sara':
                CallLog.objects.create(
                    entity_type='lead',
                    entity_id=lead.id,
                    outcome='busy',
                    notes='Line busy'
                )
                CallLog.objects.create(
                    entity_type='lead',
                    entity_id=lead.id,
                    outcome='noAnswer',
                    notes=''
                )

        self.stdout.write(self.style.SUCCESS('Successfully seeded data'))

from django.test import TestCase
from rest_framework.test import APIClient
from api.models import Users


class Milestone4ApiTests(TestCase):
	def setUp(self):
		self.client = APIClient()
		self.admin = Users.objects.create(
			email='admin-m4@test.com',
			username='Admin M4',
			password='admin123',
			role='admin',
		)
		self.client.force_authenticate(user=self.admin)

	def test_timetable_status_endpoint_returns_payload(self):
		response = self.client.get('/api/admin/timetable/status/')
		self.assertEqual(response.status_code, 200)
		self.assertIn('is_published', response.data)

	def test_timetable_telemetry_requires_event_name(self):
		response = self.client.post('/api/admin/timetable/telemetry/', {}, format='json')
		self.assertEqual(response.status_code, 400)

module.exports = {
  apps: [
    {
      name: 'fleet-backend',
      script: 'uvicorn',
      // Bound to 8050 to safely bypass your current Uvicorn process running on 8000
      args: 'main:app --host 127.0.0.1 --port 8050 --workers 2',
      interpreter: '/home/vagrant/FleetSync/backend/venv/bin/python3',
      cwd: '/home/vagrant/FleetSync/backend', 
      env: {
        DATABASE_URL: 'postgresql://fleet_admin:secure_pass@localhost:5432/fleet_tco_db',
        ENV: 'production'
      }
    }
  ]
};

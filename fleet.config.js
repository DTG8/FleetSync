module.exports = {
  apps: [
    {
      name: 'fleet-backend',
      script: '/home/vagrant/FleetSync/backend/venv/bin/uvicorn',
      args: 'main:app --host 127.0.0.1 --port 8050 --workers 2',
      interpreter: 'none',
      cwd: '/home/vagrant/FleetSync/backend',
      env: {
        PATH: '/home/vagrant/FleetSync/backend/venv/bin:' + process.env.PATH,
        VIRTUAL_ENV: '/home/vagrant/FleetSync/backend/venv',
        ENV: 'production'
      }
    }
  ]
};

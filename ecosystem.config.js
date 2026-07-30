module.exports = {
  apps: [
    {
      name: 'digitceed-agent',
      script: 'npm',
      args: 'run start',
      cwd: './.',
      instances: 1,
      exec_mode: 'fork',
      interpreter: 'cmd',
      interpreter_args: '/c',
      env: {
        NODE_ENV: 'production',
        PORT: 3005,
      },
    },
  ],
}

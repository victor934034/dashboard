module.exports = {
    apps: [
        {
            name: 'br-dashboard-backend',
            script: 'src/server.js',
            cwd: './br-dashboard/backend',
            instances: 1,
            autorestart: true,
            watch: false,
            max_memory_restart: '1G',
            env: {
                NODE_ENV: 'production',
                PORT: 3003
            },
            error_file: './logs/backend-error.log',
            out_file: './logs/backend-out.log',
            log_date_format: 'YYYY-MM-DD HH:mm:ss'
        },
        {
            name: 'br-dashboard-frontend',
            script: 'npm',
            args: 'run dev',
            cwd: './app',
            instances: 1,
            autorestart: true,
            watch: false,
            max_memory_restart: '500M',
            env: {
                NODE_ENV: 'production'
            },
            error_file: './logs/frontend-error.log',
            out_file: './logs/frontend-out.log',
            log_date_format: 'YYYY-MM-DD HH:mm:ss'
        }
    ]
};

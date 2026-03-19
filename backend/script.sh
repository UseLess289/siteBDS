#!/bin/bash

for x in $#; do
    node -e "require('dotenv').config(); const pool = require('./db'); pool.query('INSERT INTO admins (login) VALUES (\$1) ON CONFLICT DO NOTHING', ['$x']).then(() => { console.log(' Ajouté'); process.exit(0); })"
done

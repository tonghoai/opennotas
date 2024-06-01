#!/bin/bash

if ! command -v turso &> /dev/null
then
    echo "Turso CLI chưa được cài đặt. Đang cài đặt..."
    curl -sSfL https://get.tur.so/install.sh | bash
    echo "Turso CLI đã được cài đặt."
fi

# login
echo "Please login:"
turso auth login

# get database name
read -p "Database name: " db_name

# get sql
echo "Downloading schema.sql..."
curl -s -o schema.sql http://localhost:3000/schema.sql > /dev/null

# create turso database
echo "creating database..."
turso db create "$db_name" --from-dump schema.sql > /dev/null

# get database url
db_url=$(turso db show "$db_name" --url)

# generate auth token
auth_token=$(turso db tokens create "$db_name")

# return information
echo "Your config information:"
echo ""
echo "{\"url\":\"$db_url\",\"authToken\":\"$auth_token\"}"

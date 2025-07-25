# Scheduler module

This module is responsible for scheduling polls finalization after the voting period ends. It uses a Redis database to store scheduled polls and their finalization data. The module provides endpoints to create, delete, and retrieve scheduled polls. Each schedule poll is a timeout (a scheduled task that will be executed at a later time) that will finalize the poll. In case of the service being restarted, the scheduled polls are reloaded from the database and the timeouts are recreated.

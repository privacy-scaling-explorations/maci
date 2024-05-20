#!/bin/bash
set -ex

tasks="maci-coordinator"
for task in $tasks; do
  maci_coordinator_revision=$(aws ecs describe-task-definition --task-definition $task --query "taskDefinition.revision")
  aws ecs update-service --cluster maci-coordinator --service $task --force-new-deployment --task-definition $task:$maci_coordinator_revision
done

for loop in {1..3}; do
  [ "$loop" -eq 3 ] && exit 1
  aws ecs wait services-stable --cluster maci-coordinator --services $tasks && break || continue
done

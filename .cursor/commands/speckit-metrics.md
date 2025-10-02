# SpecKit Metrics

Show metrics and statistics for completed tasks.

## Usage
```
/speckit-metrics [period]
```

## What it does
1. Displays task completion stats
2. Shows agent performance metrics
3. Tracks veto rates and reasons
4. Calculates CLI usage costs
5. Identifies bottlenecks

## Arguments
- `period`: Optional time period (7d, 30d, all)

## Metrics include
- Tasks completed/failed
- Average duration per task
- Agent success/redo rates
- Claude veto frequency
- Cost per task
- Test pass rates

## Script
```bash
npm run speckit:metrics
```

TEMPLATE FOR RETROSPECTIVE (Team 10)
=====================================

The retrospective should include _at least_ the following
sections:

- [process measures](#process-measures)
- [quality measures](#quality-measures)
- [general assessment](#assessment)

## PROCESS MEASURES 

### Macro statistics

- Number of stories committed:3 vs. done:3 
- Total points committed:7 vs. done:7
- Nr of hours planned: 99h vs. spent: 103h

**Remember**a story is done ONLY if it fits the Definition of Done:
 
- Unit Tests passing
- Integration Tests passing
- End-to-End tests performed
- Code review completed
- Code present on VCS


### Detailed statistics

| Story  | # Tasks | Points | Hours est. | Hours actual |
|--------|---------|--------|------------|--------------|
| 0      |   9     |   -    |     23h    |      26h     |
| 1      |   18    |   3    |     31h    |    33h 50m   |  
| 2      |   14    |   3    |     30h    |    29h 40m   |  
| 3      |   14    |   1    |     15h    |    13h 30m   |  
> story 0 (`Uncategorized`) is for technical tasks, leave out story points (not applicable in this case)

- Hours per task average, standard deviation (estimate and actual)

|            | Mean  | StDev |
|------------|-------|-------|
| Estimation | 1.87  | 0.56  | 
| Actual     | 1.96  | 0.70  |

- Total estimation error ratio: sum of total hours spent / sum of total hours effort - 1

    $$\frac{\sum_i spent_{task_i}}{\sum_i estimation_{task_i}} - 1$$
    
- Absolute relative task estimation error: sum( abs( spent-task-i / estimation-task-i - 1))/n

    $$\frac{1}{n}\sum_i^n \left| \frac{spent_{task_i}}{estimation_task_i}-1 \right| $$
  
## QUALITY MEASURES 

- Unit Testing:
  - Total hours estimated               5
  - Total hours spent                   4
  - Nr of automated unit test cases     125
  - Coverage                            88%
- E2E testing:
  - Total hours estimated                2h 30m 
  - Total hours spent                    2h
  - Nr of test cases                     86 
- Code review 
  - Total hours estimated                22h 30m
  - Total hours spent                    22h 20m
  


## ASSESSMENT

- What did go wrong in the sprint?
  We estimated three tasks which were already covered in other tasks.
  We had too specific tasks.

- What caused your errors in estimation (if any)?
  We didn't consider that some functions whould be shared between stories, so we added and estimated unuseful testing tasks.
  
- What lessons did you learn (both positive and negative) in this sprint?
  We learned that we need to plan the sprint better (we had overly specific tasks) and finish the assigned tasks 1 or 2 days before delivery. We also learned that it's important to ALWAYS have a branch ready for delivery with all the tasks implemented up to that point. It is also important to correctly assign tasks to the various resources. In recent weeks we have had a poorly parallelized work flow which has led to some people being unable to work because they had to wait for other tasks to be completed.

- Which improvement goals set in the previous retrospective were you able to achieve? 

- Which ones you were not able to achieve? Why?

- Improvement goals for the next sprint and how to achieve them (technical tasks, team coordination, etc.)
  The sole objective for the next sprint planning is to resolve all the issues we encountered this time. We can achieve this with better sprint planning and better use of commits.

- One thing you are proud of as a Team!!
Stay humble, stay foolish!
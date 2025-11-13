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

|            | Mean | StDev |
|------------|------|-------|
| Estimation |      |       | 
| Actual     |      |       |

- Total estimation error ratio: sum of total hours spent / sum of total hours effort - 1

    $$\frac{\sum_i spent_{task_i}}{\sum_i estimation_{task_i}} - 1$$
    
- Absolute relative task estimation error: sum( abs( spent-task-i / estimation-task-i - 1))/n

    $$\frac{1}{n}\sum_i^n \left| \frac{spent_{task_i}}{estimation_task_i}-1 \right| $$
  
## QUALITY MEASURES 

- Unit Testing:
  - Total hours estimated               5
  - Total hours spent                   4
  - Nr of automated unit test cases     
  - Coverage                            
- E2E testing:
  - Total hours estimated                 
  - Total hours spent                     
  - Nr of test cases                      
- Code review 
  - Total hours estimated                 
  - Total hours spent                     
  


## ASSESSMENT

- What did go wrong in the sprint?
  We estimated three tasks which were already covered in other tasks.
  We had too specific tasks.

- What caused your errors in estimation (if any)?
  We didn't consider that some functions whould be shared between stories, so we added and estimated unuseful testing tasks.
  

- What lessons did you learn (both positive and negative) in this sprint?
  

- Which improvement goals set in the previous retrospective were you able to achieve? 
  
- Which ones you were not able to achieve? Why?

- Improvement goals for the next sprint and how to achieve them (technical tasks, team coordination, etc.)

  > Propose one or two

- One thing you are proud of as a Team!!
Stay humble, stay foolish!
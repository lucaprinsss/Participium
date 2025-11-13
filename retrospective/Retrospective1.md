RETROSPECTIVE SPRINT 1 PARTICIPIUM (Team 10)
=====================================

The retrospective includes the following sections:

- [process measures](#process-measures)
- [quality measures](#quality-measures)
- [general assessment](#assessment)

## PROCESS MEASURES 

### Macro statistics

- Number of stories committed: 3 vs. done: 3 
- Total points committed: 7 vs. done: 7
- Nr of hours planned: 99h vs. spent: 103h

**Remember** a story is done ONLY if it fits the Definition of Done:
 
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

> Story 0 (`Uncategorized`) is for technical tasks, story points are left out (not applicable in this case)

- Hours per task average, standard deviation (estimate and actual)

  |            | Mean  | StDev |
  |------------|-------|-------|
  | Estimation | 1.87  | 0.56  | 
  | Actual     | 1.96  | 0.70  |

- Total estimation error ratio:

    $$\frac{\sum_i spent_{task_i}}{\sum_i estimation_{task_i}} - 1 = \frac{103}{97.5} - 1 = 0.056 $$
    
- Absolute relative task estimation error:

    $$\frac{1}{n}\sum_i^n \left| \frac{spent_{task_i}}{estimation_{task_i}}-1 \right| = \frac{3.370}{50} = 0.067 $$
  
## QUALITY MEASURES 

- Unit Testing:
  - Total hours estimated               5h
  - Total hours spent                   4h
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
   - We estimated three tasks which were already covered in other tasks.
   - We had too specific tasks.
   - Poor parallelization of tasks.

- What caused your errors in estimation (if any)?
   - We didn't consider that some functions whould be shared between stories, so we added and estimated unuseful testing tasks.
  
- What lessons did you learn (both positive and negative) in this sprint?
  - We learned that we need to plan the sprint better (we had overly specific tasks) and finish the assigned tasks 1 or 2 days before delivery. 
  - It's important to ALWAYS have a branch ready for delivery with all the tasks implemented up to that point.
  - It is also important to correctly assign tasks to the various resources. In recent weeks we have had a poorly parallelized work flow which has led to some people being unable to work because they had to wait for other tasks to be completed.

- Which improvement goals set in the previous retrospective were you able to achieve?
  - Be more precise in task subdivision: we created tasks that were more specific.
  - Allocate more time to discuss technical aspects: we had several meetings to discuss technical issues and solutions.
  - Implement E2E tests for all stories.

- Which ones you were not able to achieve? Why?
  - Enhance team coordination: we still had some issues in coordinating tasks and sharing information because we didn't have a clear plan for task dependencies as it was the first sprint for the project.
  - Use consistently Git workflow: we had some issues with branches and merges due to lack of experience with working with it and because we were in a hurry to deliver the project.

- Improvement goals for the next sprint and how to achieve them (technical tasks, team coordination, etc.)
  - Improve sprint planning and enhance task parallelization: carefully review and define tasks to avoid overlaps and excessive specificity and ensuring tasks can be worked on simultaneously by different team members.
  - Finish tasks before the deadline: aim to complete all tasks 1–2 days before the sprint ends. This buffer allows time for integration, testing, and addressing unexpected issues.
  - Adopt a clearer Git workflow: establish and follow a consistent branching strategy (e.g., Git Flow) to minimize merge conflicts and improve collaboration.

- One thing you are proud of as a Team!!
  - Stay humble, stay foolish!
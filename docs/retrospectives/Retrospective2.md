RETROSPECTIVE SPRINT 2 PARTICIPIUM (Team 10)
=====================================

The retrospective includes the following sections:

- [process measures](#process-measures)
- [quality measures](#quality-measures)
- [general assessment](#assessment)

## PROCESS MEASURES 

### Macro statistics

- Number of stories committed: 5 vs. done: 5 
- Total points committed: 18 vs. done: 18 
- Nr of hours planned: 98h 30m vs. spent: 101h 40m

**Remember** a story is done ONLY if it fits the Definition of Done:
 
- Unit Tests passing
- Integration Tests passing
- End-to-End tests performed
- Code review completed
- Code present on VCS

### Detailed statistics

| Story  | # Tasks | Points | Hours est. | Hours actual |
|--------|---------|--------|------------|--------------|
| 0      |   8     |   -    |  25h 45m   |   33h 15m    |
| 4      |   5     |   5    |  9h 30m    |    8h 10m    |
| 5      |   11    |   2    |  20h       |   18h 50m    |
| 6      |   11    |   2    |  19h 30m   |   19h 40m    |
| 7      |   9     |   8    |  13h 30m   |   12h 15m    |
| 8      |   8     |   1    |  10h 15m   |    9h 30m    |

> Story 0 (`Uncategorized`) is for technical tasks, story points are left out (not applicable in this case)

- Hours per task average, standard deviation (estimate and actual)

  |            | Mean  | StDev |
  |------------|-------|-------|
  | Estimation | 1.8942  | 2.4119  | 
  | Actual     | 1.9356  | 3.2059  |

The formulas used are:

$$\text{Mean }(\mu)=\frac{1}{n}\sum_{i=1}^n x_i$$

$$\text{Sample standard deviation }(s)=\sqrt{\frac{1}{n-1}\sum_{i=1}^n (x_i-\mu)^2}$$

- Total estimation error ratio:

    $$\frac{\sum_i spent_{task_i}}{\sum_i estimation_{task_i}} - 1 = 0.0219 $$
    
- Absolute relative task estimation error:

    $$\frac{1}{n}\sum_i^n \left| \frac{spent_{task_i}}{estimation_{task_i}}-1 \right| = 0.0889 $$
  
## QUALITY MEASURES 

- Unit Testing:
  - Total hours estimated               4h 45m
  - Total hours spent                   4h 45m
  - Nr of automated unit test cases     321     
- Integration testing:
  - Total hours estimated               3h 45m
  - Total hours spent                   3h 45m
  - Nr of test cases                    301       
- E2E testing:
  - Total hours estimated               3h 45m
  - Total hours spent                   3h 45m
  - Nr of test cases                    122

Total coverage: 90.38% 
Total number of tests: 744

- Code review 
  - Total hours estimated               15h
  - Total hours spent                   10h 10m

## ASSESSMENT

- What did go wrong in the sprint?
   - We under estimated the hours for implementing some stories (we underestimated sprint planning and we overestimated code review).
   - We spent more hours on story 5 with less story point (2) but for the story 4 that has more story point (5) we spent less hours . 
   - We were on a rush to finish in the last days. 

- What caused your errors in estimation (if any)?
   - We had some internal role changes from back-end to front-end and vice versa. It took more time for the new roles to be adapted with the tasks they were assigned to.
   - Since we committed 5 stories with respect to the previous 3, each person did not make it in time to schedule their personal tasks in a optimal way.
  
- What lessons did you learn (both positive and negative) in this sprint?
  - We can do more than three tasks per Sprint so we will keep this pace.
  - We learned that we need to be more on time for our assigned tasks . 

- Which improvement goals set in the previous retrospective were you able to achieve?
  - Improve sprint planning and enhance task parallelization: carefully review and define tasks to avoid overlaps and excessive specificity and ensuring tasks can be worked on simultaneously by different team members.
  - Enhance team coordination: we still had some issues in coordinating tasks and sharing information because we didn't have a clear plan for task dependencies as it was the first sprint for the project.
  - We were able to finish 5 stories in this sprint and we had a progress with respect to the last sprint that we only did 3 stories done. 

- Which ones you were not able to achieve? Why? 
 - Finish tasks before the deadline: aim to complete all tasks 1–2 days before the sprint ends. This buffer allows time for integration, testing, and addressing unexpected issues.

- Improvement goals for the next sprint and how to achieve them (technical tasks, team coordination, etc.)
  - The improvement of sprint planning was obvious but we still can do better and dedicate more time for not having the same misunderstandings in estimation of tasks.
  - To stablish internal deadline for the stories, so we would be more organized and on time.

- One thing you are proud of as a Team!!
  - 

  
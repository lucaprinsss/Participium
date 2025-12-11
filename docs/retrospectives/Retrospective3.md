RETROSPECTIVE 3 (Team 10)
=====================================

The retrospective should include _at least_ the following
sections:

- [process measures](#process-measures)
- [quality measures](#quality-measures)
- [general assessment](#assessment)

## PROCESS MEASURES 

### Macro statistics

- Number of stories committed: 4 vs done : 4
- Total points committed: 18pts vs done : 18pts  (Sprint2: 18pts)
- Nr of hours planned: 98h vs spent (as a team) : 97h 15m

Our Definition of Done:
 
- Unit Tests passing
- Integration tests passing
- Code review completed
- Code present on VCS
- End-to-End tests performed


### Detailed statistics

| Story  | # Tasks | Points | Hours est. | Hours actual |
|--------|---------|--------|------------|--------------|
|  #0    |   10    |    -   |     39h    |    39h 30m   |
|  #24   |   14    |    8   |     22h    |    21h 45m   |
|  #25   |    9    |    3   |     12h    |    13h       |
|  #26   |    7    |    2   |     8h     |    8h        |
|  #27   |   10    |    5   |     17h    |    15h       |
   
- Hours per task average, standard deviation (estimate and actual)

  |            | Mean  | StDev |
  |------------|-------|-------|
  | Estimation | 1.96  | 2.62  | 
  | Actual     | 1.95  | 2.63  |

The formulas used are:

$$\text{Mean }(\mu)=\frac{1}{n}\sum_{i=1}^n x_i$$

$$\text{Sample standard deviation }(s)=\sqrt{\frac{1}{n-1}\sum_{i=1}^n (x_i-\mu)^2}$$

- Total estimation error ratio:

    $$\frac{\sum_i spent_{task_i}}{\sum_i estimation_{task_i}} - 1 = -0.0077 (Sprint2 : 0.0219)$$
    
- Absolute relative task estimation error:

    $$\frac{1}{n}\sum_i^n \left| \frac{spent_{task_i}}{estimation_{task_i}}-1 \right| = 0.0525 (Sprint2 : 0.0889)$$

  
## QUALITY MEASURES 

- Unit Testing:
  - Total hours estimated : 6h
  - Total hours spent : 6h
  - Nr of automated unit test cases : 581
  - Coverage :                    ????????????????????????????????????????????????
- Integration testing:
  - Total hours estimated : 6h
  - Total hours spent : 6h
- E2E testing:
  - Total hours estimated : 5h
  - Total hours spent : 6h
- Code review: 
  - Total hours estimated : 6h
  - Total hours spent : 5h 45min
- Technical Debt management:
  - Strategy adopted : We gave priority to high impact issues, starting from the ones that require less effort.
  - Total hours estimated estimated at sprint planning : 9h (10% of total time)
  - Total hours spent : 9h
  
## TECHNICAL DEPT
- Goals: 
  - Maintainability rate: A
  - Security: B
  - Reliability: B
  - Code duplication: below 5%
  - Test coverage: above 80%

- Result optained:
  - Maintainability rate: A
  - Security: A
  - Reliability: B //before that it was D and we have managed to improve until level B
  - Code duplication: 4.3% (overall code), 3.02% (new code) 
  - Test coverage: 89.72%


## ASSESSMENT

- What caused your errors in estimation (if any)?
  - We did a bit of overestimation on time for the code review.
  - we had an extra task that was not needed.

- What lessons did you learn (both positive and negative) in this sprint?
  - we learned we are able to keep the pace in a balanced way as we had same story points done as previous.
  - it's not necessary to rush the last day of the Sprint if we plan and respect internal deadlines

- Which improvement goals set in the previous retrospective were you able to achieve? 
  - we have set internal deadlines and we were on time
  - we improve our Sprint Planning skills

- Which ones you were not able to achieve? Why?
  - we had a little bit of overestimation in some tasks

- Improvement goals for the next sprint and how to achieve them (technical tasks, team coordination, etc.)
  - we still need to be more percise with the estimation of tasks so we would be able not to overestimate or underestimate it.
  - even though we have managed to meet our planned technical debt thresholds, we can still improve our rates. 

- One thing you are proud of as a Team!!
  - we believe in each other's work!

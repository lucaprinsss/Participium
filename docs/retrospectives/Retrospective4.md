RETROSPECTIVE SPRINT 4 PARTICIPIUM (Team 10)
=====================================

- [process measures](#process-measures)
- [quality measures](#quality-measures)
- [technical debt](#technical-debt)
- [general assessment](#assessment)

## PROCESS MEASURES 

### Macro statistics

- Number of stories committed vs done : 7 vs 7 
- Total points committed vs done : 27pts vs 27pts
- Nr of hours planned vs spent (as a team) : 96h vs 96h20m

Our Definition of Done:
 
- Unit Tests passing
- Integration tests passing
- End-to-End tests performed
- Code review completed
- Code present on VCS


### Detailed statistics


| Story    | # Tasks | Points | Hours est. | Hours actual |
|----------|---------|--------|------------|--------------|
| _#0_     |   11    |   -    |    34h     |    32h20m    |
| n 28     |    6    |   2    |    6h      |      6h      |
| n 15     |    5    |   8    |    4h      |      3h      |
| n 09     |    7    |   3    |    6h30m   |    6h30m     |
| n 30     |    7    |   8    |    7h      |      8h      |
| n 10     |   13    |   1    |    16h     |     17h      |
| n 11     |   14    |   2    |   14h30m   |    14h30m    |
| n 12     |    5    |   3    |    8h      |      9h      |
   
- Hours per task average, standard deviation (estimate and actual)

  |            | Mean  | StDev |
  |------------|-------|-------|
  | Estimation |  1.41 |   2.31| 
  | Actual     | 1.41  | 2.25  |

The formulas used are:

$$\text{Mean }(\mu)=\frac{1}{n}\sum_{i=1}^n x_i$$

$$\text{Sample standard deviation }(s)=\sqrt{\frac{1}{n-1}\sum_{i=1}^n (x_i-\mu)^2}$$

- Total estimation error ratio:

    $$\frac{\sum_i spent_{task_i}}{\sum_i estimation_{task_i}} - 1 = 0.0032$$
    
- Absolute relative task estimation error:

    $$\frac{1}{n}\sum_i^n \left| \frac{spent_{task_i}}{estimation_{task_i}}-1 \right| = 0.0491$$

  
## QUALITY MEASURES 

- Unit Testing:
  - Total hours estimated : 5h
  - Total hours spent : 5h10m
  - Nr of automated unit test cases :1168

- Integration testing:
  - Total hours estimated : 6h
  - Total hours spent : 4h40m
  - Nr test cases : 909

- E2E testing:
  - Total hours estimated : 5h
  - Total hours spent : 5h
  - Nr of test cases : 386

- Total Test Cases: 2463
- Total Test Coverage : 94.34%

- Code review: 
  - Total hours estimated : 9h
  - Total hours spent : 9h

- Technical Debt management:
  - Strategy adopted : We gave priority to high impact issues, starting from the ones that require less effort.
  - Total hours estimated estimated at sprint planning : 9h (10% of total time)
  - Total hours spent : 7h20m
  
## TECHNICAL DEBT
- Goals: 
  - Maintainability rate: A
  - Security: B
  - Reliability: B
  - Code duplication: below 5%
  - Test coverage: above 80%

- Results obtained:
  - Maintainability rate: A
  - Security: A
  - Reliability: A (before that it was B and we have managed to improve until level A)
  - Code duplication: 0.7%
  - Test coverage: 94.34% (on vscode) 91.20% (on sonarqube)



## ASSESSMENT

- What caused your errors in estimation (if any)?
  - We did a bit of underestimation on tests.

- What lessons did you learn (both positive and negative) in this sprint?
  - Once you make a good sprint plannig, working on tasks will be easier. Indeed we were able to increase the number of story points from 18 to 27 in this sprint.


- Which improvement goals set in the previous retrospective were you able to achieve? 
  - We improved our Sprint Planning skills.
  - We were able to improve even more the rates of technical debt.


- Which ones you were not able to achieve? Why?
  - We were able to achieve all ours goals.

- Improvement goals for the next sprint and how to achieve them (technical tasks, team coordination, etc.)
  - Even though we have managed to improve all the technical debt rates to A, we can still reduce the number of problems on sonarQube. 


- One thing you are proud of as a Team!!
  - We were able to manage the initial problems and we are very proud of your job!

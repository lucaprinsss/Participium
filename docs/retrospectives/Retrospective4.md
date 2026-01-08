RETROSPECTIVE SPRINT 4 PARTICIPIUM (Team 10)
=====================================

- [process measures](#process-measures)
- [quality measures](#quality-measures)
- [technical debt](#technical-debt)
- [general assessment](#assessment)

## PROCESS MEASURES 

### Macro statistics

- Number of Stories committed vs done : 7 vs 7 
- Total Points committed vs done : 27pts vs 27pts
- Nr of hours planned vs spent (as a team) : 96h vs 96h20m

Our Definition of Done:
 
- Unit Tests passing
- Integration Tests passing
- End-to-End Tests performed
- Code Review completed
- Code present on VCS


### Detailed statistics


| Story    | # Tasks | Points | Hours est. | Hours actual |
|----------|---------|--------|------------|--------------|
|   #0     |   11    |   -    |    34h     |    32h20m    |
|  #09     |    7    |   2    |    6h30m   |    6h30m     |
|  #10     |   13    |   8    |    16h     |     17h      |
|  #11     |   14    |   3    |   14h30m   |    14h30m    |
|  #12     |    5    |   8    |    8h      |      9h      |
|  #15     |    5    |   1    |    4h      |      3h      |
|  #28     |    6    |   2    |    6h      |      6h      |
|  #30     |    7    |   3    |    7h      |      8h      |
   
- Hours per Task average, standard deviation (estimated and actual)

  |            | Mean  | StDev |
  |------------|-------|-------|
  | Estimation | 1.41  | 2.31  | 
  | Actual     | 1.41  | 2.25  |

The formulas used are:

$$\text{Mean }(\mu)=\frac{1}{n}\sum_{i=1}^n x_i$$

$$\text{Sample standard deviation }(s)=\sqrt{\frac{1}{n-1}\sum_{i=1}^n (x_i-\mu)^2}$$

- Total estimation error ratio:

    $$\frac{\sum_i spent_{task_i}}{\sum_i estimation_{task_i}} - 1 = 0.0032  (0.32\%)$$
    
- Absolute relative task estimation error:

    $$\frac{1}{n}\sum_i^n \left| \frac{spent_{task_i}}{estimation_{task_i}}-1 \right| = 0.0491  (4.91\%)$$

  
## QUALITY MEASURES 

- Unit Testing:
  - Total hours estimated : 5h
  - Total hours spent : 5h10m
  - Nr of automated Unit Test Cases : 1168

- Integration Testing:
  - Total hours estimated : 6h
  - Total hours spent : 5h40m
  - Nr Test Cases : 909

- E2E Testing:
  - Total hours estimated : 5h
  - Total hours spent : 5h
  - Nr of Test Cases : 386

- Total Test Cases: 2463
- Total Test Coverage : 94.34%

- Code Review: 
  - Total hours estimated : 9h
  - Total hours spent : 9h

- Technical Debt management:
  - Strategy adopted : Strategy adopted: We gave priority to high-impact issues, starting with those that required less effort.
  - Total hours estimated estimated at Sprint Planning : 9h (10% of total time)
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
  - We made some small errors in estimating the time for tests:
    - Some tests were slightly overestimated because the features to test were small and did not require much time.
    - For other tests, we spent a bit more time because we had to add features after the tests were already written.
  - We did a little bit less TD because we where already at 16 hours/Sprint and the grades on SonarQube were already perfect.

- What lessons did you learn (both positive and negative) in this sprint?
  - Once you make a good Sprint Planning, working on Tasks becomes easier. In fact, we were able to increase the number of Story Points from 18 to 27 in this Sprint.


- Which improvement goals set in the previous Retrospective were you able to achieve? 
  - We improved our Sprint Planning skills.
  - We were able to further improve our Technical Debt ratings.


- Which ones you were not able to achieve? Why?
  - We were able to achieve all ours goals.

- Improvement goals for the next sprint and how to achieve them (technical tasks, team coordination, etc.)
  - Even though we have managed to improve all the Technical Debt ratings to A, we can still reduce the number of issues on SonarQube. This can be done by avoiding the introduction of new issues and resolving the existing ones.


- One thing you are proud of as a Team!!
  - We were able to overcome our initial problems and now we are very proud of our work!!💪

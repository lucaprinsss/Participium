# Technical Debt Management Strategy

## 1. Code Quality Checks and Target Ranges

To guarantee high code quality throughout our development lifecycle, we integrated SonarCloud analysis into our GitHub Actions pipeline. This automated check is triggered on every push to the main, qa, and dev branches. Our strategy relies on Quality Gates that prevent code merging if it deviates significantly from our targets.

We have defined clear acceptance criteria for any ephemeral branch merging into our primary branches. Giving priority to the ease of future development, our strictest requirement is that the **maintainability rating** on new code must always be A: this ensures that the codebase remains clean and easy to evolve. To balance strict quality with development speed, we adopt a more flexible approach for the other metrics: we accept a **security and reliability rating** of B, provided there are no critical vulnerabilities or blocking bugs. Regarding code duplications, our target is to keep the density below 5% on new code to avoid maintenance overhead. Finally, addressing our testing needs, we require that Test Coverage on New Code falls within a target range of at least 80%. This ensures that while we keep our existing code clean, any new feature is well tested before integration.

## 2. Strategy to Pay Back Technical Debt

We manage technical debt by categorizing issues based on a priority scale derived from the impact versus effort matrix. This approach allows us to maximize our ROI by focusing on the most valuable improvements first.

1. Our highest priority is assigned to **High Impact and Low Effort** issues: these are critical items such as security vulnerabilities, bugs in core features, or missing tests on new logic. Since these issues pose a high risk but are relatively quick to fix, they must be resolved immediately within the current Pull Request before merging.

2. The second level of priority concerns **High Impact and High Effort** issues: this category includes structural problems like setting up a comprehensive testing suite or refactoring complex architectural components. Since these require significant time, we do not fix them on the fly; instead, we convert them into specific Technical Debt tasks in our backlog and prioritize them during Sprint Planning.

3. Finally, we assign the lowest priority to **Low Impact and Low Effort** issues, such as minor code smells or small styling inconsistencies: we address these using an opportunistic approach known as the "Boy Scout Rule," where developers are encouraged to fix these minor issues only when they are already working on those specific files for other reasons. 

We generally ignore Low Impact and High Effort issues, as they do not provide enough value to justify the cost.

## 3. Internal Organization and Workflow

To ensure this strategy is applied effectively, we treat debt remediation as an integral part of our sprint cycle rather than an afterthought. We allocate a specific portion of our sprint capacity, approximately 10-15%, to technical tasks such as refactoring or improving test coverage.

The responsibility for resolving issues generally falls on the developer currently working on the relevant module. However, for larger architectural debt, we create specific tasks in our backlog to be assigned during sprint planning. We also review our quality metrics and debt trends during every sprint retrospective to determine if our thresholds need adjustment.
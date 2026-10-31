---
'@veljaos/ui': minor
---

P5.96: Questions and answers, a page of its own. `QuestionsAndAnswers` shows every question of a portal (300 and more) on CommonQuestion's data: one search field that filters as you type and marks the words found, the categories as chips with their counts, a row per question linking to its own answer page (`answerHref`, through the provider's `linkComponent`), 30 at a time with "Show more" (`pageSize`), and nothing found offering the application's `askAction` with the words typed. `AnswerView` is one answer's page: the question as the title with the way back, the answer, "What to do", "What you need" and the request that does it. New helpers `highlightQuestion`, `questionCounts` (`QuestionCounts`) and `QUESTIONS_PAGE`; new messages `questions.showMore` and `questions.askInstead`. `CommonQuestions` is unchanged and stays for a home page's top questions.

# Project of Data Visualization (COM-480)

| Student's name | SCIPER |
| -------------- | ------ |
| | |
| | |
| | |

[Milestone 1](#milestone-1) • [Milestone 2](#milestone-2) • [Milestone 3](#milestone-3)

## Milestone 1 (21st March, 5pm)

**10% of the final grade**

This is a preliminary milestone to let you set up goals for your final project and assess the feasibility of your ideas.
Please, fill the following sections about your project.

*(max. 2000 characters per section)*

### Dataset

> Find a dataset (or multiple) that you will explore. Assess the quality of the data it contains and how much preprocessing / data-cleaning it will require before tackling visualization. We recommend using a standard dataset as this course is not about scraping nor data processing.
>
> Hint: some good pointers for finding quality publicly available datasets ([Google dataset search](https://datasetsearch.research.google.com/), [Kaggle](https://www.kaggle.com/datasets), [OpenSwissData](https://opendata.swiss/en/), [SNAP](https://snap.stanford.edu/data/) and [FiveThirtyEight](https://data.fivethirtyeight.com/)), you could use also the DataSets proposed by the ENAC (see the Announcements section on Zulip).

### Problematic

> Frame the general topic of your visualization and the main axis that you want to develop.
> - What am I trying to show with my visualization?
> - Think of an overview for the project, your motivation, and the target audience.

### Exploratory Data Analysis

> Pre-processing of the data set you chose
> - Show some basic statistics and get insights about the data

The dataset contains 61,556,964 records spanning ten years (mean of 6155696.4 per year, SD = 481266.1), ranging from ~ 5.6M records in 2016 to ~ 7.2M records in 2018. Each record includes information on the flight, the scheduled and actual departure and arrival times, and reasons for and information on delays.

We find a mean departure delay of 9.04 minutes with a median of 0.00, indicating that many flights depart on time. However, this data feature comes with a high standard deviation (37.14 minutes), suggesting variability in departure delay. Similarly, regarding the arrival delay, we find a mean of 4.70 and a median of -1.00 minutes (indicating arriving earlier than expected), but a standard deviation of 39.44 minutes. We also find that the 75th percentile for this feature is 18 minutes, suggesting that most flights have relatively small delays. An observation of the overall cancellation and diversion rate shows small relative values (1.58% and 0.24%, respectively).

We then explore the overall trends of the dataset across years. The mean departure delay, while peaking in 2014, has a generally increasing pattern from earlier years to later years (as can be seen in Figure 1), suggesting worsening delays. Regarding cancellation rates, we don't see a clear increasing or decreasing pattern over years (Figure 2). Similarly, regarding diversions, they remain relatively stable across the years (Figure 3), suggesting that flight re-routing due to operational constraints has not changed significantly.

![Figure 1: Average Departure Delay by Year](eda-fig1.png)

*Figure 1: Average departure delay by year.*

![Figure 2: AverageCancellation Rate by Year](eda-fig2.png)

*Figure 2: Average cancellation rate by year.*

![Figure 3: Mean of the number of diverted flights per year](eda-fig3.png)

*Figure 3: Mean of the number of diverted flights per year.*

We also find that flights scheduled earlier in the day, particularly around 5 AM, tend to experience minimal delays compared to the rest of the day, with many even departing slightly ahead of schedule. However, delays start accumulating throughout the afternoon, reaching their maximum in the late evening at around 8 PM (as can be seen in Figure 4). This pattern suggests that delays are compounding over the course of the day, likely due to higher air traffic congestion, operational inefficiencies, or rolling effects from earlier delays.

![Figure 4: Mean Departure Delay by Scheduled Hour](eda-fig4.png)

*Figure 4: Mean departure delay by scheduled hour.*

Additionally, we observe seasonal variations in flight delays (Figure 5). They tend to peak in June/July which aligns with the vacation season. The lowest average delays occur in September, possibly due to lower travel demand directly after the holidays and start of the school semester.

![Figure 5: Average Departure Delay by Month](eda-fig5.png)

*Figure 5: Average departure delay by month.*

### Related work


> - What others have already done with the data?
> - Why is your approach original?
> - What source of inspiration do you take? Visualizations that you found on other websites or magazines (might be unrelated to your data).
> - In case you are using a dataset that you have already explored in another context (ML or ADA course, semester project...), you are required to share the report of that work to outline the differences with the submission for this class.

## Milestone 2 (18th April, 5pm)

**10% of the final grade**


## Milestone 3 (30th May, 5pm)

**80% of the final grade**


## Late policy

- < 24h: 80% of the grade for the milestone
- < 48h: 70% of the grade for the milestone


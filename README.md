# AppDynamics Chart Visualizer
A third-party tool that allows juxtaposing AppDynamics Controller Metrics across different servers, applications, other entities, different time periods and varying time intervals. Allows users to compare/analyze any combination of any amount of metrics, and then save and share the graph via a unique URL. 

[![No Maintenance Intended](http://unmaintained.tech/badge.svg)](http://unmaintained.tech/)

## Why?
The current metric browser only allows comparing different metrics across a set time period and with a baseline.

## Fetching data from the controller
As long as a controller can be publicly accessed, it should work with this tool. Controller information / account credentials are provided in the form for adding net metrics to the graph visualizer.

## Getting the data for visualization
In order to fetch data from the controller for visualization the following information is necessary:
* Controller username
* Controller account name
* Controller user password
* Start time of desired metric (UTC)
* End time of desired metric (UTC)

#### AND

**EITHER:**

* Metric Browser URL
		: On the metric browser, on the left side there is a sidebar of metrics. Double click any metric measure, and your Internet browser's URL should change. Copy and paste that URL. Repeat for any metric.

**OR (NOT SUGGESTED):**

*You will need to track your network calls while using the metric browser to retrieve these*

* Host Info (IP address + port, no `http://` or `https://` preceding)
* Entity ID (Usually one/two digit number)
* Metric ID (Usually three/four digit number)
* Entity Type (Usually all caps string)

## Why sign in?
User accounts are important for future features. Feel free to remove them (but make sure to modify the Mongoose model of the saved graph).

## Installation
```
cd {DIRECTORY}
npm install
npm install --save node-sass@3.3.3
```
*You may need to change the node-sass vendor version from Linux to OSX or vise versa.*

# License
The MIT License (MIT)

Copyright (c) 2016 Eric Zhao

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

**Major contributions**

Built off of `https://github.com/ericzhao28/nodeApp-starter-template`

* `nodeApp-starter-template` includes modified contributions from `https://github.com/sahat/hackathon-starter/`

Javascript Chart Library used: `https://github.com/chartjs/Chart.js`

#AppDynamics Chart Visualizer
A third-party tool that allows juxtaposing AppDynamics Controller Metrics across different servers, applications, other entities, different time periods and varying time intervals. Allows users to compare/analyze any combination of any amount of metrics, and then save and share the graph via a unique URL. 

#Fetching data from the controller
As long as a controller can be publicly accessed, it should work with this tool. Controller information / account credentials are provided in the form for adding net metrics to the graph visualizer.

#Getting the data for visualization
In order to fetch data from the controller for visualization the following information is necessary:
- Controller username
- Controller account name
- Controller user password
- Start time of desired metric (UTC)
- End time of desired metric (UTC)
AND EITHER:
	- Metric Browser URL
		: On the metric browser, on the left side there is a sidebar of metrics. Double click any metric measure, and your Internet browser's URL should change. Copy and paste that URL. Repeat for any metric.
	OR (NOT SUGGESTED):
		: You will need to track your network calls while using the metric browser to retrieve these
	- Host Info (IP address + port, no http:// or https:// preceding)
	- Entity ID (Usually one/two digit number)
	- Metric ID (Usually three/four digit number)
	- Entity Type (Usually all caps string)

#Why sign in?
User accounts are important for future features. Feel free to remove them (but make sure to modify the Mongoose model of the saved graph).

#Installation
cd {DIRECTORY}
npm install
npm install --save node-sass@3.3.3
!! You may need to change the node-sass vendor version from Linux->OSX or vise versa.

#Copyright
Includes basic user authentication + Facebook OAuth. Licenses of used open source projects can be found at the top of files + LICENSE file.
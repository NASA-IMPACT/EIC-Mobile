# Earth Information Center Mobile Concept Application

The Earth Information Center Mobile application concept is a custom application that uses NASA SVS videos for visualization and image services for analysis. By tying the visualizations to the underlying data in a custom application, NASA Earth data becomes more accessible and easier to understand for the public. The application provides the most up-to-date information as the underlying services are updated by dynamically reading the configured video and image services. And finally, this application offers a mobile-first experience, allowing anyone to explore the application in its entirety from their mobile device 

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See deployment for notes on how to deploy the project on a live system. Before deploying outside of testing, you will want to configure the ```config.json``` file to point the application to the proper video and image service endpoints.

### Prerequisites

What things you need to install the software and how to install them

* [Git](https://github.com/git-guides/install-git) - Version Control System
* [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) - Version Control System
* [Node.js](https://nodejs.org/en/download/package-manager) - JavaScript Runtime Environment
* [React + Vite](https://vitejs.dev/) - Web Framework

### Installing

Clone the GitHub Repo

```
git clone https://github.com/cwaltsgeo/EIC-Mobile.git
```

Navigate to the ```EIC-Mobile``` project folder

```
cd EIC-Mobile
```

Install the ```EIC-Mobile``` project dependencies

```
npm install
```

Test in dev mode

```
npm run dev
```

## Git Workflow

This project follows a Gitflow branching model:

- Feature/Bugfix Branches: Start development from a feature or bugfix branch. Use a meaningful branch name like feature/your-feature or bugfix/your-bugfix.

- Pull Request to Development Branch: When your work is ready, open a pull request (PR) from your feature or bugfix branch to the development branch.

- Staging Deployment: Once the PR is merged into the development branch, the changes will automatically be deployed to the staging environment for further testing.

- Production Deployment: If the changes in staging are approved, open a PR from the development branch to the main branch. Upon merging, the changes will be deployed to the production environment.

## Branch Protection Rules
- Development Branch: The development branch is protected, and direct commits are not allowed. All changes must come through pull requests.

- Main Branch: The main branch is also protected and only accepts pull requests from the development branch.


## Configuration

The ```config.json``` file is a vital metadata file that points the application to the proper video and image service endpoints. For the application to run properly, it’s important to configure the file according to the following parameters.

| Property | Data Type | Description|
|----------|----------|----------|
| ```name```            | string    | Layer Name                                                        |
| ```description```     | string    | Layer Description                                                 |
| ```unit```            | string    | Unit of Measurement                                               |
| ```video```           | string    | Video Service endpoint                                            |
| ```service```         | string    | Image Service REST endpoint                                       |
| ```wcs```             | boolean   | Value determines if service is or is not OGC WCS                  |
| ```wcsParams```       | dict      | A dictionary of required parameters to request an OGC WCS service |
| ```active```          | boolean   | Value determines what layer is or is not visible                  |
| ```vitals```          | dict      | A dictionary of summary statistics from the Image Service         |
| ```tour```            | list      | A list of stops for the layer's Guided Tour                       |

## Deployment

In order to deploy this application to a live system, you'll need to first establish the following architecture:

* [ArcGIS Enterprise](https://enterprise.arcgis.com/en/) - Image Services
* [AWS S3](https://aws.amazon.com/s3/) - Video Services
* [AWS S3 + CloudFront](https://docs.aws.amazon.com/prescriptive-guidance/latest/patterns/deploy-a-react-based-single-page-application-to-amazon-s3-and-cloudfront.html) - Application Deployment


Configure ```config.json``` with the proper metadata and service endpoints

```
vi ./src/config.json
```

Build the project ```dist``` folder

```
npm run build
```

Upload the project ```dist``` folder to AWS S3

```
aws s3 sync ./dist s3://<your-bucket-name>/ 
```

## Application Built With

* [React + Vite](https://vitejs.dev/guide/) - Web Framework
* [ArcGIS Maps SDK for JavaScript](https://developers.arcgis.com/javascript/latest/) - GIS SDK
* [Chart.js](https://www.chartjs.org/) - Data Visualization Library
* [Tailwind.css](https://tailwindcss.com/) - CSS Framework
* [HeadlessUI](https://headlessui.com/) - UI Components
* [Heroicons](https://heroicons.com/) - Icons
* [React Share](https://github.com/nygardk/react-share#readme) - Social Media Sharing

## Authors

* **Alex Gurvich** - [agurvich](https://github.com/agurvich)
* **Cole Walts** - [cwaltsgeo](https://github.com/cwaltsgeo)

## License

This project is licensed under the MIT License

## Acknowledgments

* NASA Scientific Visualization Studio
e
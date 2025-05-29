# Project of Data Visualization (COM-480)

delay ✈️
/dɪˈleɪ/

noun
    The nightmare of flyers.

![A queue of airplanes waiting for take-off](assets/cover_image.webp)

copyright for [Pilot Bible](https://pilotbible.com/atc-slots-ready-message/)

## Students 🧑‍🎓

| Student's name                                                       | SCIPER | Affiliation        | Contact                    |
| :------------------------------------------------------------------: | ------ | :----------------: | :------------------------: |
| [Aryan Ahadinia](https://people.epfl.ch/aryan.ahadinia/?lang=en)     | 387868 | Master of CS, EPFL | <aryan.ahadinia@epfl.ch>   |
| [Matin Ansaripour](https://people.epfl.ch/matin.ansaripour?lang=en)  | 370664 | Master of CS, EPFL | <matin.ansaripour@epfl.ch> |
| [Seyed Parsa Neshaei](https://people.epfl.ch/seyed.neshaei/?lang=en) | 355567 | EDIC, EPFL         | <seyed.neshaei@epfl.ch>    |

(alphabetical order)

## Final Deliverables 🚚

- [Website](https://com-480-data-visualization.github.io/MAP/) 🕸️
- [Process Book]() 📖
- [Screen Cast]() 📽️

## Structure of the Repository 🏛️

The repository is holding the structure of our react project. This is mainly for easy deployment. The assets of each milestones are included in the following directories.

- [Milestone 1](./milestones/m1)
- [Milestone 2](./milestones/m2)
- [Milestone 3](./milestones/m3)

## How to Run 🏃‍♀️

### Prerequisites 🛠️

1. Git
2. Node.js
3. NPM

The project is tested with node version 22.14.0 and npm version 11.2.0 on macOS 15.5.

### Quick Setup 🚀

Just copy and paste following commands into your terminal.

```bash
git clone https://github.com/com-480-data-visualization/MAP
cd MAP
npm install
npm run dev
```

The project will (most likely) start in <http://localhost:5173/MAP/> (if the `5173` port of your system is free).

### Deployment 🎤

We are using GitHub Pages for hosting our project. Follow the following instruction.

1. **COMMIT** and **PUSH** the state of the project you want to deploy.

   ```bash
   git add --all
   git commit -m "your commit message"
   git push origin
   ```

2. Deploy the porject using the following command.

   ```bash
   npm run deploy
   ```

## Data Preparation 🧐

Data is already preprocessed and served in the website, however, you can follow the following steps to reproduce the preprocessed data.

Data Source: <https://www.kaggle.com/datasets/yuanyuwendymu/airline-delay-and-cancellation-data-2009-2018>.

### Data Preparations Prerequisites 🛠️

You need followings installed and ready-to-use on your system.

1. Python with Pandas

2. Kaggle API; refer to [Kaggle API docs](https://github.com/Kaggle/kaggle-api/blob/main/docs/README.md#download-dataset-files) for installation instructions. Make sure you have set username and API key.

### Reproduction 📊

1. Download the dataset from Kaggle and unzip it.

   - create directories.

     ```bash
     mkdir milestones/m3/analysis/data
     cd milestones/m3/analysis/data
     ```

   - download the data from Kaggle.

     ```bash
     kaggle datasets download yuanyuwendymu/airline-delay-and-cancellation-data-2009-2018
     ```

   - unzip the data.

     ```bash
     unzip airline-delay-and-cancellation-data-2009-2018.zip
     ```

   - clean up.

     ```bash
     rm airline-delay-and-cancellation-data-2009-2018.zip
     cd ../../../..
     ```

2. Execute the Python pre-processing script.

   ```bash
   python milestones/m3/analysis/airport_route_data.py
   ```

   The script will produce several processed CSV files in `milestones/m3/analysis/output`.

3. Move the result to react `public`.

   ```bash
   cp milestones/m3/analysis/output/*.csv public/data/
   ```

## Tech Stack 🧑‍💻

<div align="center">
	<code><img width="50" src="https://raw.githubusercontent.com/marwin1991/profile-technology-icons/refs/heads/main/icons/github.png" alt="GitHub" title="GitHub"/></code>
	<code><img width="50" src="https://raw.githubusercontent.com/marwin1991/profile-technology-icons/refs/heads/main/icons/html.png" alt="HTML" title="HTML"/></code>
	<code><img width="50" src="https://raw.githubusercontent.com/marwin1991/profile-technology-icons/refs/heads/main/icons/css.png" alt="CSS" title="CSS"/></code>
	<code><img width="50" src="https://raw.githubusercontent.com/marwin1991/profile-technology-icons/refs/heads/main/icons/javascript.png" alt="JavaScript" title="JavaScript"/></code>
	<code><img width="50" src="https://raw.githubusercontent.com/marwin1991/profile-technology-icons/refs/heads/main/icons/react.png" alt="React" title="React"/></code>
	<code><img width="50" src="https://raw.githubusercontent.com/marwin1991/profile-technology-icons/refs/heads/main/icons/typescript.png" alt="TypeScript" title="TypeScript"/></code>
	<code><img width="50" src="https://raw.githubusercontent.com/marwin1991/profile-technology-icons/refs/heads/main/icons/npm.png" alt="npm" title="npm"/></code>
	<code><img width="50" src="https://raw.githubusercontent.com/marwin1991/profile-technology-icons/refs/heads/main/icons/node_js.png" alt="Node.js" title="Node.js"/></code>
	<code><img width="50" src="https://raw.githubusercontent.com/marwin1991/profile-technology-icons/refs/heads/main/icons/vite.png" alt="Vite" title="Vite"/></code>
</div>

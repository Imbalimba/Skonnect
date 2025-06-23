Laravel Project - Imbalimba
Overview
This Laravel project has been split into multiple repositories due to space limitations. The main application code is in this repository, while the node_modules dependencies have been separated into individual repositories.
Repository Structure
Main Repository

Imbalimba/Skonmeet - Main Laravel application (this repository)

Contains all PHP/Laravel code
Contains package.json and frontend source files
Note: node_modules folder has been removed to save space



Node Modules Repositories
The node_modules dependencies are split across these repositories:

Imbalimba/node1 - Node modules part 1
Imbalimba/node2 - Node modules part 2
Imbalimba/node3 - Node modules part 3
Imbalimba/node4 - Node modules part 4

Setup Instructions
1. Clone the Main Repository
bashgit clone https://github.com/Imbalimba/Skonmeet.git
cd Skonmeet
2. Install PHP Dependencies
bashcomposer install
3. Download Node Modules
Since the node_modules are split across multiple repositories, you have two options:
Option A: Download and Merge Node Modules (Recommended)
bash# Create node_modules directory
mkdir node_modules

# Clone each node modules repository
git clone https://github.com/Imbalimba/node1.git temp_node1
git clone https://github.com/Imbalimba/node2.git temp_node2
git clone https://github.com/Imbalimba/node3.git temp_node3
git clone https://github.com/Imbalimba/node4.git temp_node4

# Copy contents to node_modules (adjust paths as needed)
cp -r temp_node1/* node_modules/
cp -r temp_node2/* node_modules/
cp -r temp_node3/* node_modules/
cp -r temp_node4/* node_modules/

# Clean up temporary directories
rm -rf temp_node1 temp_node2 temp_node3 temp_node4

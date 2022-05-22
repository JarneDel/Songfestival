# Startup Guide

## Clone de repo

Clone de repo naar VS Code en bekijk alle bestanden om een overzicht te krijgen van de verschillende backend en front-end bestanden.

## Virtual Environment

### Aanmaken van een nieuwe venv

Zoals tijdens elk project van FSWD maken we een nieuwe venv aan door in de terminal volgend commando in te tikken:

- Voor ![Windows logo](https://icons.getbootstrap.com/assets/icons/windows.svg) : `py -m venv venv_fswd`
- Voor ![Mac logo](https://icons.getbootstrap.com/assets/icons/apple.svg) : `python3 -m venv venv_fswd`

Sluit hierna in VS Code de terminal en open een nieuwe en check of je in je venv aan het werken bent.

### Installeren van de benodigde packages via pip

Eerst zullen we nu de nodige packages installeren op onze nieuw gemaakte venv.
Voor het gemak hebben we alle nodige packages opgeslagen in het bestand requirements.txt.

Het installeren van de nodige packages kan met het volgende commando:

- Voor ![Windows logo](https://icons.getbootstrap.com/assets/icons/windows.svg) : `pip install -r ./requirements.txt`
- Voor ![Mac logo](https://icons.getbootstrap.com/assets/icons/apple.svg) : `pip install -r requirements.txt`

## Database

### SQL importeren

Open MySQLWorkbench en importeer het SQL-bestand. In het bestand staat ook onze standaarduser `root_fswd` met als standaardpaswoord `root_fswd`.

### Config voor de database aanpassen

Maak een kopie van _config_example.py_ met de naam _config.py_ en vul het paswoord voor de database aan.

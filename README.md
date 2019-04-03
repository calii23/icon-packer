This script packs SVG icons into a Vaadin Flow HTML file.

After the execution the only thing needed to do is to add
```kotlin
@HtmlImport("frontend://icons.html")
```
to the main layout or
```html
<link rel="import" href="icons.html">
```
to a html component. The application must provide files
from the `static` directory in the resources on Vaadin root
path. (Default in Spring Boot)

# config.json
Configure the behavior of this script.

Look at the `config-example.json` file for an example.

Note: All paths given in this file are relative to the location
of this config file not to the pwd.
## iconsDir
The path to the directory where the icons are placed. The icons must
be in SVG format.
## distDir
The directory for the output files.
## setName
The Vaadin icon collection name. (e.g. `custom-icons`)
## iconSize
The size of the icons in pixel. (e.g. `24`)
## padding
The padding around the icons. (recommended: 4)
## iconsFileName
The file name for the icons html file. (e.g. `icons.html`)
## enum
A object with properties for the enum class generation.
### className
The class name for the enum class
### package
The package of the enum class
### interfaces
A list of interfaces that the enum class should implements
### collectionNameProperty (optional)
If this property is set, a property which contains the name of
the set will generated. In Java a getter method will generated
and in kotlin a final property. This object must contains a
`name` and a `override` key.
### iconNameProperty
The name of the property, in which the name of the icon stored.
In Java a getter method will generated and in kotlin a final 
property. This object must contains a `name` and a `override` key.
### createFunction (optional)
If this property is set, a method to create a vaadin icon will
be generated. This object must contains a `name` and a `override` key.
### language
The language the enum class should generated in. In this version `java` and
`kotlin` are supported.
## targetProjectRoot (optional)
If this property is set, the output files will copied into the
project. The project must have the following structure:
The resources must be placed  into `${projectRoot}/src/main/resources`
and the sources into `${projectRoot}/src/main/kotlin`

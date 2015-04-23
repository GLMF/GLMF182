/***********************************************/
/*  Inclusion des librairies                   */
/***********************************************/

var blessed = require('blessed')
var contrib = require('blessed-contrib')
var screen = blessed.screen()


/***********************************************/
/*  Création d'une grille simple               */
/***********************************************/

// on définit le nombre de lignes et de colonnes de la grille
var grid = new contrib.grid({rows: 1, cols: 1})

// on met un élément de type boîte de texte dans une case de la grille
grid.set(0, 0, 
         blessed.box,
         {content: 'Bonjour GLMF ! '})

// on lie la grille à l'écran
grid.applyLayout(screen)


/***********************************************/
/*  Préparation de l'affichage                 */
/***********************************************/

// On raraichit régulièrement
interval = 1
setInterval(function() {
    screen.render()
}, interval * 1000)

// On active des touches pour quitter proprement
screen.key(['escape', 'q', 'C-c'], function(ch, key) {
  return process.exit(0);
});

// Premier affichage
screen.render()

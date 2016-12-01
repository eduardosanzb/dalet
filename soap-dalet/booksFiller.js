import Books from './books.model'
export default function createBooks(report) {
    report.content.map(book => {
        Books.findOne({
            name: book.ItemName
        }, function(err, x) {
          if(err) return console.log(err);
          if(x){
            var metrics = cleanMetrics(book.ItemPerformance.Instance)
            var newStat = {
                type: book.ItemPerformance.Category,
                month: book.ItemPerformance.Period["End"].substring(5, 7),
                ft_total: metrics.ft_total,
                ft_pdf: metrics.ft_pdf,
                ft_html: metrics.ft_html
            }
            if(x.stats[0].month === newStat.month){
              x.stats[0] = newStat
              console.log(`Book updated: ${x.name} with fresh stats`);
            } else {
              x.stats.push(newStat)
              console.log(`Book updated: ${x.name} with new stats`);
            }
            x.save()
          } else {
            createANewBook(book, report)
          }
        })

    })
}

function createANewBook(book, report) {
    var ISNB = cleanISNB(book.ItemIdentifier)
    var attributes = book.ItemPerformance.attributes || null
    var newBook = new Books({
        _provider: report._provider,
        _career: null,
        name: book.ItemName,
        type: book.ItemDataType,
        publisher: book.ItemPublisher,
        platform: book.ItemPlatform,
        attributes: attributes,
        print_ISNB: ISNB.print,
        online_ISNB: ISNB.online,
        propietary_ISNB: ISNB.proprietary
    });
    
    var metrics = cleanMetrics(book.ItemPerformance.Instance)
    var newStat = {
        type: book.ItemPerformance.Category,
        month: book.ItemPerformance.Period["End"].substring(5, 7),
        ft_total: metrics.ft_total,
        ft_pdf: metrics.ft_pdf,
        ft_html: metrics.ft_html
    }
    newBook.stats.push(newStat)
    newBook.save()
    console.log(`New book created: ${newBook.name}`);
}

function cleanMetrics(metrics){
  var theMetric = {}
  if(Array.isArray(metrics)){
    theMetric = metrics.reduce((acum, curr) => {
      acum[curr.MetricType] = curr.Count
      return acum
    },{})
  } else {
    theMetric[metrics.MetricType] = metrics.Count
  }
  theMetric.ft_total = theMetric.ft_total || 0
  theMetric.ft_pdf = theMetric.ft_pdf || 0
  theMetric.ft_html = theMetric.ft_html || 0
  return theMetric
}
function cleanISNB(value){
  var theBook = {}
  if(Array.isArray(value)){
    theBook = value.reduce((acum, curr) => {
      acum[curr.Type] = curr.Value
      return acum
    },{})
  } else {
    if(value)
      theBook[value.Type] = value.Value
  }
  theBook.print = theBook.Print_ISBN || null
  theBook.online = theBook.Online_ISBN || null
  theBook.proprietary = theBook.Proprietary || null
  return theBook
}






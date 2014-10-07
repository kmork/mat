package controllers

import play.api.mvc._
import com.mongodb.casbah.Imports._
import play.api.Play
import play.api.Play.current
import play.api.libs.json.Json
import scala.Some

object Application extends Controller {

  val uri = MongoClientURI(Play.configuration.getString("mongodb.uri").get)
  val mongoClient = MongoClient(uri)
  val coll = mongoClient("matmaps")("map")

  def index = Action {
    Ok(views.html.index())
  }

  def newMap = Action {
    var mongoDoc : MongoDBObject = null
    var mapId : String = null
    do {
      mapId = RandomString.createRandomString(16)
      mongoDoc = MongoDBObject("id" -> mapId, "eventId" -> 1.toLong, "event" -> "map_created")
    } while (coll.findOne(mongoDoc) isDefined)
    coll.insert( mongoDoc )
    Redirect(routes.Application.getMap(mapId))
  }

  def getMap(mapId: String) = Action {
    coll.findOne(MongoDBObject("id" -> mapId)) match {
      case Some(map) =>
        if (map.get("content") != null) {
          Ok(views.html.loadMap())
        } else {
          Ok(views.html.newMap())
        }
      case None => NotFound(views.html.notFound())
    };
  }

  def saveMap(mapId: String, cmdId: String, cmd: String, content: String) = Action {
    coll.insert(
      MongoDBObject("id" -> mapId, "eventId" -> (cmdId.toLong + 1), "event" -> cmd, "content" -> content)
    )
    Ok
  }

  def loadMap(mapId: String) = Action {
    val query = MongoDBObject("id" -> mapId) ++ ("content" $exists true )
    val fields = MongoDBObject("_id" -> false, "eventId" -> true, "event" -> true, "content" -> true)
    val sort = MongoDBObject("eventId" -> 1)
    val result = coll.find(query, fields).sort(sort).toList
    Ok(Json.parse(com.mongodb.util.JSON.serialize(result)))
  }
}
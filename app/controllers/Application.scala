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
  val mapColl = mongoClient("matmaps")("map")
  val roColl = mongoClient("matmaps")("ro_map")

  def index = Action {
    Ok(views.html.index())
  }

  def newMap = Action {
    var mongoDoc : MongoDBObject = null
    var mapId : String = null
    do {
      mapId = RandomString.createRandomString(16)
      mongoDoc = MongoDBObject("id" -> mapId, "eventId" -> 1.toLong, "event" -> "map_created")
    } while (mapColl.findOne(mongoDoc) isDefined)
    mapColl.insert( mongoDoc )

    var readOnlyMongoDoc : MongoDBObject = null
    var readOnlyMapId : String = null
    do {
      readOnlyMapId = RandomString.createRandomString(16)
      readOnlyMongoDoc = MongoDBObject("id" -> readOnlyMapId, "reference" -> mapId)
    } while (roColl.findOne(mongoDoc) isDefined)
    roColl.insert( readOnlyMongoDoc )

    Redirect(routes.Application.getMap(mapId))
  }

  def getMap(mapId: String) = Action {
    roColl.findOne(MongoDBObject("reference" -> mapId)) match {
      case Some(map) => Ok(views.html.loadMap(map.get("id").toString()))
      case None => NotFound(views.html.notFound())
    }
  }

  def saveMap(mapId: String, cmdId: String, cmd: String, content: String) = Action {
    mapColl.insert(
      MongoDBObject("id" -> mapId, "eventId" -> (cmdId.toLong + 1), "event" -> cmd, "content" -> content)
    )
    Ok
  }

  def loadMap(mapId: String) = Action {
    Ok(Json.parse(findAllEventsForMap(mapId)))
  }

  def getReadOnlyURL(mapId: String) = Action {
    roColl.findOne(MongoDBObject("reference" -> mapId)) match {
      case Some(map) => Ok(map.get("id").toString())
      case None => NotFound
    }
  }

  def getReadOnlyMap(mapId: String) = Action {
    roColl.findOne(MongoDBObject("id" -> mapId)) match {
      case Some(map) => Ok(views.html.loadReadOnlyMap())
      case None => NotFound(views.html.notFound())
    }
  }

  def loadReadOnlyMap(mapId: String) = Action {
    roColl.findOne(MongoDBObject("id" -> mapId)) match {
      case Some(map) => Ok(Json.parse(findAllEventsForMap(map.get("reference").toString())))
      case None => NotFound(views.html.notFound())
    }
  }

  // Helper function, not an action
  def findAllEventsForMap(mapId: String) : String = {
    val query = MongoDBObject("id" -> mapId) ++ ("content" $exists true )
    val fields = MongoDBObject("_id" -> false, "eventId" -> true, "event" -> true, "content" -> true)
    val sort = MongoDBObject("eventId" -> 1)
    val result = mapColl.find(query, fields).sort(sort).toList
    com.mongodb.util.JSON.serialize(result)
  }
}
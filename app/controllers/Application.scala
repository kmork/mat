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
    var mongoDoc : MongoDBObject = null;
    var mapId : String = null
    do {
      mapId = RandomString.createRandomString(16)
      mongoDoc = MongoDBObject("id" -> mapId)
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

  def saveMap(mapId: String, cmdId: String, content: String) = Action {
    val updateQ = $push ("content" -> MongoDBObject("command" -> content))
    coll.update(MongoDBObject("id" -> mapId), updateQ)
    Ok
  }

  def loadMap(mapId: String) = Action {
    coll.findOne(MongoDBObject("id" -> mapId) ++ ("content" $exists true )) match {
      case Some(map) => Ok(Json.parse(map("content").toString()))
      case None => NotFound
    };
  }
}